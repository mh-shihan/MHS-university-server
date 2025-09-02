/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { courseSearchableField } from './course.constant';
import { Course, CourseFaculty } from './course.model';
import AppError from '../../errors/AppError';
import status from 'http-status';
import { TCourse, TCourseFaculty } from './course.interface';

const createCourseIntoDB = async (payload: TCourse) => {
  const result = await Course.create(payload);
  return result;
};

const getAllCoursesFromDB = async (query: Record<string, unknown>) => {
  const courseQuery = new QueryBuilder(
    Course.find().populate('preRequisiteCourses.course'),
    query,
  )
    .search(courseSearchableField)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await courseQuery.modelQuery;
  const meta = await courseQuery.countTotal();

  return {
    meta,
    result,
  };
};

const getSingleCourseFromDB = async (id: string) => {
  const result = await Course.findById(id).populate(
    'preRequisiteCourses.course',
  );
  return result;
};

const updateCourseIntoDB = async (id: string, payload: Partial<TCourse>) => {
  const { preRequisiteCourses, ...remainingCourseInfo } = payload;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Step-1: Basic Course Info
    const updateBasicCourseInfo = await Course.findByIdAndUpdate(
      id,
      remainingCourseInfo,
      {
        new: true,
        runValidators: true,
        session,
      },
    );

    if (!updateBasicCourseInfo) {
      throw new AppError(
        status.BAD_REQUEST,
        'Failed to Update Basic Course Info!',
      );
    }

    // Check if there any pre requisite courses to update
    if (preRequisiteCourses && preRequisiteCourses.length > 0) {
      // Filter out the deleted course field
      const deletedPreRequisites = preRequisiteCourses
        .filter((el) => el.course && el.isDeleted)
        .map((el) => el.course);

      const deletedPreRequisitesCourse = await Course.findByIdAndUpdate(
        id,
        {
          $pull: {
            preRequisiteCourses: { course: { $in: deletedPreRequisites } },
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!deletedPreRequisitesCourse) {
        throw new AppError(status.BAD_REQUEST, 'Failed to Update Course !');
      }

      // Filter out the deleted new course field
      const newPreRequisites = preRequisiteCourses.filter(
        (el) => el.course && !el.isDeleted,
      );

      const newPreRequisitesCourse = await Course.findByIdAndUpdate(
        id,
        {
          $addToSet: { preRequisiteCourses: { $each: newPreRequisites } },
        },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!newPreRequisitesCourse) {
        throw new AppError(status.BAD_REQUEST, 'Failed to Update Course !');
      }
    }

    await session.commitTransaction();
    await session.endSession();

    const result = await Course.findById(id).populate(
      'preRequisiteCourses.course',
    );

    return result;
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(error);
  }
};

const deleteCourseFromDB = async (id: string) => {
  const result = await Course.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  return result;
};

const getAllCourseFacultiesFromDB = async () => {
  const result = await CourseFaculty.find()
    .populate({
      path: 'course',
      populate: {
        path: 'preRequisiteCourses.course', // Adjust this if your schema supports it
      },
    })
    .populate('faculties');
  return result;
};

const assignFacultiesWithCourseIntoDB = async (
  id: string,
  faculties: string[],
) => {
  if (!faculties || faculties.length === 0) {
    throw new AppError(
      status.BAD_REQUEST,
      'At least one faculty must be provided',
    );
  }

  // Step 1: Find existing document by course
  const existing = await CourseFaculty.findOne({ course: id }).lean();

  // Step 2: Check for duplicates if the document exists
  if (existing) {
    const duplicateFaculties = faculties.filter((fid) =>
      existing.faculties.some((existingId) =>
        new Types.ObjectId(existingId?.toString()).equals(fid),
      ),
    );

    if (duplicateFaculties.length > 0) {
      throw new AppError(
        status.CONFLICT,
        `Faculty already assigned: ${duplicateFaculties.join(', ')}`,
      );
    }
  }

  // Step 3: Upsert the document (create if doesn't exist, update if exists)
  const result = await CourseFaculty.findByIdAndUpdate(
    id,
    {
      course: id,
      $addToSet: { faculties: { $each: faculties ?? [] } },
    },
    {
      upsert: true,
      new: true,
    },
  );

  return result;
};

const removeFacultiesFromCourseFromDB = async (
  id: string,
  payload: Partial<TCourseFaculty>,
) => {
  const result = await CourseFaculty.findByIdAndUpdate(
    id,
    {
      $pull: { faculties: { $in: payload } },
    },
    { new: true },
  );

  return result;
};

export const CourseServices = {
  createCourseIntoDB,
  getAllCoursesFromDB,
  getSingleCourseFromDB,
  updateCourseIntoDB,
  deleteCourseFromDB,
  getAllCourseFacultiesFromDB,
  assignFacultiesWithCourseIntoDB,
  removeFacultiesFromCourseFromDB,
};
