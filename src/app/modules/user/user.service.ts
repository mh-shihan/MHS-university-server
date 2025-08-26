import status from 'http-status';
import config from '../../config';
import AppError from '../../errors/AppError';
import { AcademicSemester } from '../academicSemester/academicSemester.model';
import { TStudent } from '../student/student.interface';
import { Student } from '../student/student.model';
import { TRole, TUser } from './user.interface';
import { User } from './user.model';
import { generatedStudentId, generateUserIdByRole } from './user.utils';
import mongoose from 'mongoose';
import { TFaculty } from '../faculty/faculty.interface';
import { Faculty } from '../faculty/faculty.model';
import { Admin } from '../admin/admin.model';
import { TAdmin } from '../admin/admin.interface';

// CREATE STUDENT
const createStudentIntoDB = async (password: string, payload: TStudent) => {
  const userData: Partial<TUser> = {};
  userData.password = password || (config.default_password as string);

  // Set Student Role
  const role: TRole = 'student';
  userData.role = role;
  userData.email = payload.email;

  const academicSemester = await AcademicSemester.findById(
    payload.admissionSemester,
  );
  if (!academicSemester) {
    throw new AppError(status.NOT_FOUND, 'Academic semester Not Found');
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    // Set Generated ID
    userData.id = await generatedStudentId(academicSemester);

    // Create a User (Transaction-1)
    const newUser = await User.create([userData], { session });

    if (!newUser.length) {
      throw new AppError(status.BAD_REQUEST, 'Failed to create User');
    }

    payload.id = newUser[0].id;
    payload.user = newUser[0]._id; // Reference id

    // Create a Student (Transaction-2)
    const newStudent = await Student.create([payload], { session });
    if (!newStudent.length) {
      throw new AppError(status.BAD_REQUEST, 'Failed to create Student');
    }

    await session.commitTransaction();
    await session.endSession();

    return newStudent;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(error);
  }
};

// CREATE FACULTY
const createFacultyIntoDB = async (password: string, payload: TFaculty) => {
  const userData: Partial<TUser> = {};
  userData.password = password || (config.default_password as string);

  // Set Student Role
  const role: TRole = 'faculty';
  userData.role = role;
  userData.email = payload.email;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    // Set Generated ID
    userData.id = await generateUserIdByRole(role);

    // Create a User (Transaction-1)
    const newUser = await User.create([userData], { session });

    if (!newUser.length) {
      throw new AppError(status.BAD_REQUEST, 'Failed to create User');
    }

    payload.id = newUser[0].id; //Generated id
    payload.user = newUser[0]._id; // Reference id

    // Create a Faculty (Transaction-2)
    const newFaculty = await Faculty.create([payload], { session });
    if (!newFaculty.length) {
      throw new AppError(status.BAD_REQUEST, 'Failed to create Faculty');
    }

    await session.commitTransaction();
    await session.endSession();

    return newFaculty;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(error);
  }
};

// CREATE ADMIN
const createAdminIntoDB = async (password: string, payload: TAdmin) => {
  const userData: Partial<TUser> = {};
  userData.password = password || (config.default_password as string);

  // Set Admin Role
  const role: TRole = 'admin';
  userData.role = role;
  userData.email = payload.email;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    // Set Generated ID
    userData.id = await generateUserIdByRole(role);

    // Create a User (Transaction-1)
    const newUser = await User.create([userData], { session });

    if (!newUser.length) {
      throw new AppError(status.BAD_REQUEST, 'Failed to create User');
    }

    payload.id = newUser[0].id; //Generated id
    payload.user = newUser[0]._id; // Reference id

    // Create a Faculty (Transaction-2)
    const newAdmin = await Admin.create([payload], { session });
    if (!newAdmin.length) {
      throw new AppError(status.BAD_REQUEST, 'Failed to create Admin');
    }

    await session.commitTransaction();
    await session.endSession();

    return newAdmin;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await session.abortTransaction();
    await session.endSession();
    throw new Error(error);
  }
};

export const UserServices = {
  createStudentIntoDB,
  createFacultyIntoDB,
  createAdminIntoDB,
};
