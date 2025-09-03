import status from 'http-status';
import AppError from '../../errors/AppError';
import { Faculty } from './faculty.model';
import { TFaculty } from './faculty.interface';
import flattenNestedObject from '../../utils/flattenNestedObject';
import mongoose from 'mongoose';
import { User } from '../user/user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { FacultySearchableFields } from './faculty.constant';

const getAllFacultiesFromDB = async (query: Record<string, unknown>) => {
  const facultyQuery = new QueryBuilder(
    Faculty.find().populate({
      path: 'academicDepartment',
      populate: {
        path: 'academicFaculty',
      },
    }),
    query,
  )
    .search(FacultySearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await facultyQuery.modelQuery;
  const meta = await facultyQuery.countTotal();

  return {
    meta,
    result,
  };
};

const getSingleFacultyFromDB = async (id: string) => {
  const result = await Faculty.findById(id).populate({
    path: 'academicDepartment',
    populate: {
      path: 'academicFaculty',
    },
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, `Faculty with ID ${id} not found`);
  }

  return result;
};

const updateFacultyIntoDB = async (id: string, payload: Partial<TFaculty>) => {
  const { name, ...remainingFacultyData } = payload;

  const modifiedUpdatedData: Record<string, unknown> = {
    ...remainingFacultyData,
  };

  flattenNestedObject('name', name, modifiedUpdatedData);

  const result = await Faculty.findByIdAndUpdate(id, modifiedUpdatedData, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, `Faculty with ID ${id} not found`);
  }

  return result;
};

const deleteSingleFacultyFromDB = async (id: string) => {
  const isFacultyExist = await Faculty.isFacultyExists(id);
  if (!isFacultyExist) {
    throw new AppError(status.NOT_FOUND, 'Faculty Not Found!');
  }
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const deletedFaculty = await Faculty.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true, session },
    );

    if (!deletedFaculty) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        'Failed to delete Faculty',
      );
    }

    // Get user_id form deleted faculty
    const userId = deletedFaculty?.user;

    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true, session },
    );

    if (!deletedUser) {
      throw new AppError(status.INTERNAL_SERVER_ERROR, 'Failed to delete user');
    }

    await session.commitTransaction();
    await session.endSession();

    return deletedFaculty;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

export const FacultyServices = {
  getAllFacultiesFromDB,
  getSingleFacultyFromDB,
  updateFacultyIntoDB,
  deleteSingleFacultyFromDB,
};
