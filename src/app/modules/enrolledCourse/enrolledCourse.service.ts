/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import checkDocumentExistsById from '../../utils/checkDocumentExistsById';
import { OfferedCourse } from '../offeredCourse/offeredCourse.model';
import { TEnrolledCourse } from './enrolledCourse.interface';
import EnrolledCourse from './enrolledCourse.model';
import { Student } from '../student/student.model';
import AppError from '../../errors/AppError';
import status from 'http-status';
import mongoose from 'mongoose';
import { SemesterRegistration } from '../semesterRegistration/semesterRegistration.model';
import { Course } from '../course/course.model';

const createEnrolledCourseIntoDB = async (
  userId: string,
  payload: Partial<TEnrolledCourse>,
) => {
  const { offeredCourse } = payload;

  const existingOfferedCourse = await checkDocumentExistsById(
    OfferedCourse,
    new Types.ObjectId(offeredCourse),
    'Offered Course',
  );

  if (existingOfferedCourse.maxCapacity <= 0) {
    throw new AppError(
      status.BAD_REQUEST,
      'No available seats in this course!',
    );
  }

  // Get Course Credit
  const course = await checkDocumentExistsById(
    Course,
    new Types.ObjectId(existingOfferedCourse.course),
    'Course',
  );
  const currentCredit = course?.credits;

  // Get Student valid or not
  const student = await Student.findOne({ id: userId }, { _id: 1 });

  if (!student) {
    throw new AppError(status.NOT_FOUND, 'Student not found!');
  }

  // Check same offeredCourse
  const isSameOfferedCourse = await EnrolledCourse.findOne({
    semesterRegistration: existingOfferedCourse.semesterRegistration,
    offeredCourse,
    student: student._id,
  });

  if (isSameOfferedCourse) {
    throw new AppError(
      status.CONFLICT,
      'Already enrolled in this exact section!',
    );
  }

  // Check same course in another section
  const isSameCourse = await EnrolledCourse.findOne({
    semesterRegistration: existingOfferedCourse.semesterRegistration,
    course: existingOfferedCourse.course,
    student: student._id,
  });

  if (isSameCourse) {
    throw new AppError(
      status.CONFLICT,
      'Already enrolled in another section of this course!',
    );
  }

  const semesterRegistration = await SemesterRegistration.findById(
    existingOfferedCourse.semesterRegistration,
  ).select('maxCredit');
  const maxCredit = semesterRegistration?.maxCredit;

  const enrolledCourses = await EnrolledCourse.aggregate([
    {
      $match: {
        semesterRegistration: existingOfferedCourse?.semesterRegistration,
        student: student._id,
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'enrolledCourseDetails',
      },
    },
    {
      $unwind: {
        path: '$enrolledCourseDetails',
      },
    },
    {
      $group: {
        _id: null,
        totalEnrolledCredits: { $sum: '$enrolledCourseDetails.credits' },
      },
    },
    {
      $project: {
        _id: 0,
        totalEnrolledCredits: 1,
      },
    },
  ]);

  //  total enrolled credits + new enrolled course credit > maxCredit
  const totalCredits =
    enrolledCourses.length > 0 ? enrolledCourses[0].totalEnrolledCredits : 0;

  if (maxCredit && totalCredits + currentCredit > maxCredit) {
    throw new AppError(
      status.BAD_REQUEST,
      'You have exceeded the maximum number of credits!',
    );
  }

  payload.offeredCourse = existingOfferedCourse._id;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await EnrolledCourse.create(
      [
        {
          semesterRegistration: existingOfferedCourse.semesterRegistration,
          academicSemester: existingOfferedCourse.academicSemester,
          academicFaculty: existingOfferedCourse.academicFaculty,
          academicDepartment: existingOfferedCourse.academicDepartment,
          offeredCourse: existingOfferedCourse._id,
          course: existingOfferedCourse.course,
          student: student._id,
          faculty: existingOfferedCourse.faculty,
          isEnrolled: true,
        },
      ],
      { session },
    );

    if (!result) {
      throw new AppError(
        status.BAD_REQUEST,
        'Failed to enroll in this course !',
      );
    }

    //check maxCapacity and  Reduce Max Capacity
    const maxCapacity = existingOfferedCourse.maxCapacity;
    if (maxCapacity <= 0) {
      throw new AppError(
        status.BAD_REQUEST,
        'No available seats in this course!',
      );
    }
    await OfferedCourse.findByIdAndUpdate(offeredCourse, {
      maxCapacity: maxCapacity - 1,
    });

    await session.commitTransaction();
    await session.endSession();

    return result;
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(error);
  }
};
const updateEnrolledCourseMarksIntoDB = async () => {
  return {};
};

export const EnrolledCourseServices = {
  createEnrolledCourseIntoDB,
  updateEnrolledCourseMarksIntoDB,
};
