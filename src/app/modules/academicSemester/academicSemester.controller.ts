import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AcademicSemesterServices } from './academicSemester.service';

const createAcademicSemester = catchAsync(async (req, res) => {
  const result = await AcademicSemesterServices.createAcademicSemesterIntoDB(
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Academic Semester is created successfully',
    data: result,
  });
});

const getAllAcademicSemester = catchAsync(async (req, res) => {
  const result = await AcademicSemesterServices.getAllAcademicSemesterFromDB(
    req.query,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Academic Semesters are retrieved successfully!',
    meta: result.meta,
    data: result.result,
  });
});

const getSingleAcademicSemester = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result =
    await AcademicSemesterServices.getSingleAcademicSemesterFromDB(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Single Academic Semesters is retrieved successfully!',
    data: result,
  });
});

const updateAcademicSemester = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await AcademicSemesterServices.updateAcademicSemesterInDB(
    id,
    req.body,
  );

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Academic Semester is updated successfully!',
    data: result,
  });
});

export const AcademicSemesterControllers = {
  createAcademicSemester,
  getAllAcademicSemester,
  getSingleAcademicSemester,
  updateAcademicSemester,
};
