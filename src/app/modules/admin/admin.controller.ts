import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AdminServices } from './admin.service';

const getAllAdmin = catchAsync(async (req, res) => {
  const result = await AdminServices.getAllAdminsFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Admins are retrieved successfully!',
    meta: result.meta,
    data: result.result,
  });
});

const getSingleAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AdminServices.getSingleAdminFromDB(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Single Admin is retrieved successfully!',
    data: result,
  });
});

const updateAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { admin } = req.body;

  const result = await AdminServices.updateAdminIntoDB(id, admin);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Admin is updated successfully!',
    data: result,
  });
});

const deleteSingleAdmin = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AdminServices.deleteSingleAdminFromDB(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Single Admin is deleted successfully!',
    data: result,
  });
});

export const AdminController = {
  getAllAdmin,
  getSingleAdmin,
  updateAdmin,
  deleteSingleAdmin,
};
