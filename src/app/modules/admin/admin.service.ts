import status from 'http-status';
import QueryBuilder from '../../builder/QueryBuilder';
import { AdminSearchableFields } from './admin.constant';
import { Admin } from './admin.model';
import AppError from '../../errors/AppError';
import { TAdmin } from './admin.interface';
import flattenNestedObject from '../../utils/flattenNestedObject';
import mongoose from 'mongoose';
import { User } from '../user/user.model';

const getAllAdminsFromDB = async (query: Record<string, unknown>) => {
  const adminQuery = new QueryBuilder(Admin.find(), query)
    .search(AdminSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await adminQuery.modelQuery;
  const meta = await adminQuery.countTotal();

  return {
    meta,
    result,
  };
};

const getSingleAdminFromDB = async (id: string) => {
  const result = await Admin.findById(id);

  if (!result) {
    throw new AppError(status.NOT_FOUND, `Admin with ID ${id} not found`);
  }

  return result;
};

const updateAdminIntoDB = async (id: string, payload: Partial<TAdmin>) => {
  const { name, ...remainingAdminData } = payload;

  const modifiedUpdatedData: Record<string, unknown> = {
    ...remainingAdminData,
  };

  flattenNestedObject('name', name, modifiedUpdatedData);

  const result = await Admin.findByIdAndUpdate(id, modifiedUpdatedData, {
    new: true,
    runValidators: true,
  });

  if (!result) {
    throw new AppError(status.NOT_FOUND, `Admin with ID ${id} not found`);
  }

  return result;
};

const deleteSingleAdminFromDB = async (id: string) => {
  const isAdminExist = await Admin.isAdminExists(id);
  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, 'Admin Not Found!');
  }
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const deletedAdmin = await Admin.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true, session },
    );

    if (!deletedAdmin) {
      throw new AppError(
        status.INTERNAL_SERVER_ERROR,
        'Failed to delete Admin',
      );
    }

    // Get user_id form deleted faculty
    const userId = deletedAdmin?.user;

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

    return deletedAdmin;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

export const AdminServices = {
  getAllAdminsFromDB,
  getSingleAdminFromDB,
  updateAdminIntoDB,
  deleteSingleAdminFromDB,
};
