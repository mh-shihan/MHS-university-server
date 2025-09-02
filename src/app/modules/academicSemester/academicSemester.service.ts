import status from 'http-status';
import AppError from '../../errors/AppError';
import { academicSemesterNameCodeMapper } from './academicSemester.constant';
import { TAcademicSemester } from './academicSemester.interface';
import { AcademicSemester } from './academicSemester.model';
import academicSemesterStartEndMonths from './academicSemester.utils';

const createAcademicSemesterIntoDB = async (payload: TAcademicSemester) => {
  if (academicSemesterNameCodeMapper[payload.name] !== payload.code) {
    throw new AppError(status.BAD_REQUEST, 'Invalid Semester code!');
  }

  const academicSemesterStartEnd = academicSemesterStartEndMonths(
    payload.name as string,
  );

  const updatedData = {
    ...payload,
    ...academicSemesterStartEnd,
  };

  const result = await AcademicSemester.create({
    ...updatedData,
  });
  return result;
};

const getAllAcademicSemesterFromDB = async () => {
  const result = await AcademicSemester.find();
  return result;
};

const getSingleAcademicSemesterFromDB = async (id: string) => {
  const result = await AcademicSemester.findById(id);

  if (!result) {
    throw new AppError(
      status.NOT_FOUND,
      `Academic Semester with ID ${id} Not Found`,
    );
  }

  return result;
};

const updateAcademicSemesterInDB = async (
  id: string,
  payload: Partial<TAcademicSemester>,
) => {
  if (
    payload.name &&
    payload.code &&
    academicSemesterNameCodeMapper[payload.name] !== payload.code
  ) {
    throw new AppError(status.BAD_REQUEST, 'Invalid Semester code!');
  }

  const result = await AcademicSemester.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

export const AcademicSemesterServices = {
  createAcademicSemesterIntoDB,
  getAllAcademicSemesterFromDB,
  getSingleAcademicSemesterFromDB,
  updateAcademicSemesterInDB,
};
