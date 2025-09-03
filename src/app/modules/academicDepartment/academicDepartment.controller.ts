import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AcademicDepartmentServices } from './academicDepartment.service';

const createAcademicDepartment = catchAsync(async (req, res) => {
  const result =
    await AcademicDepartmentServices.createAcademicDepartmentIntoDB(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Academic Department is created successfully',
    data: result,
  });
});

const getAllAcademicDepartment = catchAsync(async (req, res) => {
  const result =
    await AcademicDepartmentServices.getAllAcademicDepartmentFromDB(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Academic Departments are retrieved successfully!',
    meta: result.meta,
    data: result.result,
  });
});

const getSingleAcademicDepartments = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await AcademicDepartmentServices.getSingleAcademicDepartmentsFromDB(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Single Academic Department is retrieved successfully!',
    data: result,
  });
});

const updateAcademicDepartment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AcademicDepartmentServices.updateAcademicDepartmentInDB(
    id,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Academic Department is updated successfully!',
    data: result,
  });
});

export const AcademicDepartmentControllers = {
  createAcademicDepartment,
  getAllAcademicDepartment,
  getSingleAcademicDepartments,
  updateAcademicDepartment,
};
