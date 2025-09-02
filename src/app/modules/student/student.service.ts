import status from 'http-status';
import AppError from '../../errors/AppError';
import { Student } from './student.model';
import mongoose from 'mongoose';
import { User } from '../user/user.model';
import { TStudent } from './student.interface';
import flattenNestedObject from '../../utils/flattenNestedObject';
import QueryBuilder from '../../builder/QueryBuilder';
import { studentSearchableField } from './student.constant';

const getAllStudentsFromDB = async (query: Record<string, unknown>) => {
  const studentQuery = new QueryBuilder(
    Student.find()
      .populate('admissionSemester')
      .populate({
        path: 'academicDepartment',
        populate: {
          path: 'academicFaculty',
        },
      }),
    query,
  )
    .search(studentSearchableField)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await studentQuery.modelQuery;
  const meta = await studentQuery.countTotal();

  return {
    meta,
    result,
  };
};

const getSingleStudentFromDB = async (id: string) => {
  const result = await Student.findById(id)
    .populate('admissionSemester')
    .populate({
      path: 'academicDepartment',
      populate: {
        path: 'academicFaculty',
      },
    });

  if (!result) {
    throw new AppError(status.NOT_FOUND, `Student with ID ${id} not found`);
  }

  return result;
};

const updateStudentIntoDB = async (id: string, payload: Partial<TStudent>) => {
  const { name, guardian, localGuardian, ...remainingStudentData } = payload;

  const modifiedUpdatedData: Record<string, unknown> = {
    ...remainingStudentData,
  };

  flattenNestedObject('name', name, modifiedUpdatedData);
  flattenNestedObject('guardian', guardian, modifiedUpdatedData);
  flattenNestedObject('localGuardian', localGuardian, modifiedUpdatedData);

  const result = await Student.findByIdAndUpdate(id, modifiedUpdatedData, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, `Student with ID ${id} not found`);
  }

  return result;
};

const deleteSingleStudentFromDB = async (id: string) => {
  const isStudentExist = await Student.isStudentExists(id);
  if (!isStudentExist) {
    throw new AppError(status.NOT_FOUND, 'Student Not Found!');
  }
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const deletedStudent = await Student.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true, session },
    );

    if (!deletedStudent) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        'Failed to delete student',
      );
    }

    // Get user_id form deleted faculty
    const userId = deletedStudent?.user;

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

    return deletedStudent;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

export const StudentServices = {
  getAllStudentsFromDB,
  getSingleStudentFromDB,
  updateStudentIntoDB,
  deleteSingleStudentFromDB,
};
