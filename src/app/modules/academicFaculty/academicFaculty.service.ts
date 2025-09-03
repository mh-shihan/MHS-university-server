import status from 'http-status';
import AppError from '../../errors/AppError';
import { TAcademicFaculty } from './academicFaculty.interface';
import { AcademicFaculty } from './academicFaculty.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { AcademicFacultySearchableFields } from './academicFaculty.constant';

const createAcademicFacultyIntoDB = async (payload: TAcademicFaculty) => {
  const result = await AcademicFaculty.create(payload);
  return result;
};

const getAllAcademicFacultiesFromDB = async (
  query: Record<string, unknown>,
) => {
  const academicFacultyQuery = new QueryBuilder(AcademicFaculty.find(), query)
    .search(AcademicFacultySearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await academicFacultyQuery.modelQuery;
  const meta = await academicFacultyQuery.countTotal();

  return {
    meta,
    result,
  };
};
const getSingleAcademicFacultyFromDB = async (id: string) => {
  const result = await AcademicFaculty.findById(id);

  if (!result) {
    throw new AppError(
      status.NOT_FOUND,
      `Academic Faculty with ID ${id} Not Found`,
    );
  }

  return result;
};

const updateAcademicFacultyInDB = async (
  id: string,
  payload: Partial<TAcademicFaculty>,
) => {
  const result = await AcademicFaculty.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return result;
};

export const AcademicFacultyServices = {
  createAcademicFacultyIntoDB,
  getAllAcademicFacultiesFromDB,
  getSingleAcademicFacultyFromDB,
  updateAcademicFacultyInDB,
};
