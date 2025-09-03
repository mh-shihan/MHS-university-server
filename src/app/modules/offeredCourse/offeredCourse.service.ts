import { SemesterRegistration } from '../semesterRegistration/semesterRegistration.model';
import {
  TOfferedCourse,
  TUpdateOfferedCourse,
} from './offeredCourse.interface';
import { OfferedCourse } from './offeredCourse.model';
import { AcademicFaculty } from '../academicFaculty/academicFaculty.model';
import { AcademicDepartment } from '../academicDepartment/academicDepartment.model';
import { Course } from '../course/course.model';
import checkDocumentExistsById from '../../utils/checkDocumentExistsById';
import { Faculty } from '../faculty/faculty.model';
import { Types } from 'mongoose';
import status from 'http-status';
import AppError from '../../errors/AppError';
import { hasTimeConflict } from './offeredCourse.utils';
import QueryBuilder from '../../builder/QueryBuilder';
import { Student } from '../student/student.model';

const createOfferedCourseIntoDB = async (payload: TOfferedCourse) => {
  // Check if the SEMESTER REGISTRATION id is exists!
  const {
    semesterRegistration,
    academicDepartment,
    course,
    section,
    faculty,
    days,
    startTime,
    endTime,
  } = payload;

  let academicSemester: Types.ObjectId = new Types.ObjectId();

  // Check existence using utility function
  const isSemesterRegistrationExists = await checkDocumentExistsById(
    SemesterRegistration,
    semesterRegistration,
    'Semester Registration',
  );
  if (isSemesterRegistrationExists) {
    academicSemester = isSemesterRegistrationExists.academicSemester;
  }

  const existingAcademicDepartment = await checkDocumentExistsById(
    AcademicDepartment,
    academicDepartment,
    'Academic Department',
  );

  payload.academicFaculty = existingAcademicDepartment?.academicFaculty;

  const existingAcademicFaculty = await checkDocumentExistsById(
    AcademicFaculty,
    payload.academicFaculty,
    'Academic Faculty',
  );

  await checkDocumentExistsById(Course, course, 'Course');

  await checkDocumentExistsById(Faculty, faculty, 'Faculty');

  // Check if the Department belong to the Faculty
  const isDepartmentBelongToFaculty = await AcademicDepartment.findOne({
    _id: academicDepartment,
    academicFaculty: payload.academicFaculty,
  });

  if (!isDepartmentBelongToFaculty) {
    throw new AppError(
      status.BAD_REQUEST,
      `${existingAcademicDepartment?.name} not belongs to ${existingAcademicFaculty?.name}!`,
    );
  }

  // check if the same offered course same section in same registered semester exists
  const isSameOfferedCourseExistsWithSameRegisteredSemesterWithSameSection =
    await OfferedCourse.findOne({
      semesterRegistration,
      course,
      section,
    });

  if (isSameOfferedCourseExistsWithSameRegisteredSemesterWithSameSection) {
    throw new AppError(
      status.BAD_REQUEST,
      `Offered course with same section is already exist!`,
    );
  }

  // get the schedules of the faculties
  const assignedSchedules = await OfferedCourse.find({
    semesterRegistration,
    faculty,
    days: { $in: days },
  })
    .select('days startTime endTime')
    .sort({ startTime: 1 });

  const newSchedule = {
    days,
    startTime,
    endTime,
  };

  if (hasTimeConflict(assignedSchedules, newSchedule)) {
    throw new AppError(
      status.CONFLICT,
      `This faculty is not available at that time! Choose other time or day`,
    );
  }

  const result = await OfferedCourse.create({ ...payload, academicSemester });
  return result;
};

const getAllOfferedCoursesFromDB = async (query: Record<string, unknown>) => {
  const offeredCourseQuery = new QueryBuilder(OfferedCourse.find(), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await offeredCourseQuery.modelQuery;
  const meta = await offeredCourseQuery.countTotal();

  return {
    meta,
    result,
  };
};

const getMyOfferedCoursesFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  //PAGINATION SETUP
  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const skip = (page - 1) * limit;

  // Find the STUDENT
  const student = await Student.findOne({ id: userId });
  if (!student) {
    throw new AppError(status.NOT_FOUND, 'Student not found');
  }

  // FIND CURRENT ONGOING SEMESTER
  const currentOngoingRegistrationSemester = await SemesterRegistration.findOne(
    {
      status: 'ONGOING',
    },
  );

  if (!currentOngoingRegistrationSemester) {
    throw new AppError(status.NOT_FOUND, 'There is no ongoing semester');
  }
  const aggregationQuery = [
    {
      $match: {
        semesterRegistration: currentOngoingRegistrationSemester?._id,
        academicFaculty: student.academicFaculty,
        academicDepartment: student.academicDepartment,
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'course',
      },
    },
    {
      $unwind: '$course',
    },
    {
      $lookup: {
        from: 'enrolledcourses',
        let: {
          currentOngoingRegistrationSemester:
            currentOngoingRegistrationSemester._id,
          currentStudent: student._id,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: [
                      '$semesterRegistration',
                      '$$currentOngoingRegistrationSemester',
                    ],
                  },
                  {
                    $eq: ['$student', '$$currentStudent'],
                  },
                  {
                    $eq: ['$isEnrolled', true],
                  },
                ],
              },
            },
          },
        ],
        as: 'enrolledCourses',
      },
    },
    {
      $lookup: {
        from: 'enrolledcourses',
        let: {
          currentStudent: student._id,
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$student', '$$currentStudent'],
                  },
                  {
                    $eq: ['$isCompleted', true],
                  },
                ],
              },
            },
          },
        ],
        as: 'completedCourses',
      },
    },
    {
      $addFields: {
        completedCourseIds: {
          $map: {
            input: '$completedCourses',
            as: 'completed',
            in: '$$completed.course',
          },
        },
      },
    },
    {
      $addFields: {
        isPreRequisitesFulFilled: {
          $or: [
            { $eq: ['$course.preRequisiteCourses', []] },
            {
              $setIsSubset: [
                '$course.preRequisiteCourses.course',
                '$completedCourseIds',
              ],
            },
          ],
        },

        isAlreadyEnrolled: {
          $in: [
            '$course._id',
            {
              $map: {
                input: '$enrolledCourses',
                as: 'enroll',
                in: '$$enroll.course',
              },
            },
          ],
        },
      },
    },
    {
      $match: {
        isAlreadyEnrolled: false,
        isPreRequisitesFulFilled: true,
      },
    },
  ];

  const paginationQuery = [
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];

  const result = await OfferedCourse.aggregate([
    ...aggregationQuery,
    ...paginationQuery,
  ]);

  const total = (await OfferedCourse.aggregate(aggregationQuery)).length;

  const totalPage = Math.ceil(result.length / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    result,
  };
};

const getSingleOfferedCourseFromDB = async (id: string) => {
  const offeredCourse = await OfferedCourse.findById(id);

  if (!offeredCourse) {
    throw new AppError(404, 'Offered Course not found');
  }

  return offeredCourse;
};

const updateOfferedCourseIntoDB = async (
  id: string,
  payload: TUpdateOfferedCourse,
) => {
  const { faculty, days, startTime, endTime } = payload;

  const existingOfferedCourse = await checkDocumentExistsById(
    OfferedCourse,
    new Types.ObjectId(id),
    'Offered Course',
  );
  await checkDocumentExistsById(Faculty, faculty, 'Faculty');

  // get the schedules of the faculties
  const semesterRegistration = existingOfferedCourse?.semesterRegistration;

  const semesterRegistrationStatus =
    await SemesterRegistration.findById(semesterRegistration);

  if (semesterRegistrationStatus?.status !== 'UPCOMING') {
    throw new AppError(
      status.BAD_REQUEST,
      `You can not update this offered course as it is ${semesterRegistrationStatus?.status}`,
    );
  }

  const assignedSchedules = await OfferedCourse.find({
    semesterRegistration,
    faculty,
    days: { $in: days },
  })
    .select('days startTime endTime')
    .sort({ startTime: 1 });

  const newSchedule = {
    days,
    startTime,
    endTime,
  };

  if (hasTimeConflict(assignedSchedules, newSchedule)) {
    throw new AppError(
      status.CONFLICT,
      `This faculty is not available at that time! Choose other time or day`,
    );
  }

  const result = await OfferedCourse.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

const deleteOfferedCourseFromDB = async (id: string) => {
  const existingOfferedCourse = await checkDocumentExistsById(
    OfferedCourse,
    new Types.ObjectId(id),
    'Offered Course',
  );

  // get the schedules of the faculties
  const semesterRegistration = existingOfferedCourse?.semesterRegistration;

  const semesterRegistrationStatus =
    await SemesterRegistration.findById(semesterRegistration);

  if (semesterRegistrationStatus?.status !== 'UPCOMING') {
    throw new AppError(
      status.BAD_REQUEST,
      `You can not delete this offered course! Because this offered course is ${semesterRegistrationStatus?.status}`,
    );
  }
  const result = await OfferedCourse.findByIdAndDelete(id);

  return result;
};

export const OfferedCourseServices = {
  createOfferedCourseIntoDB,
  getAllOfferedCoursesFromDB,
  getMyOfferedCoursesFromDB,
  getSingleOfferedCourseFromDB,
  updateOfferedCourseIntoDB,
  deleteOfferedCourseFromDB,
};
