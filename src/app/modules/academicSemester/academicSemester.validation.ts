import { z } from 'zod/v4';
import {
  AcademicSemesterCode,
  AcademicSemesterName,
  Months,
} from './academicSemester.constant';

const createAcademicSemesterValidationSchema = z.object({
  body: z.object({
    name: z.enum([...AcademicSemesterName]),
    year: z.string(),
    code: z.enum([...AcademicSemesterCode]),
    startMonth: z.enum([...Months]).optional(),
    endMonth: z.enum([...Months]).optional(),
  }),
});

const updateAcademicSemesterValidationSchema = z.object({
  body: z.object({
    name: z.enum([...AcademicSemesterName]).optional(),
    year: z.string().optional(),
    code: z.enum([...AcademicSemesterCode]).optional(),
    startMonth: z.enum([...Months]).optional(),
    endMonth: z.enum([...Months]).optional(),
  }),
});

export const AcademicSemesterValidations = {
  createAcademicSemesterValidationSchema,
  updateAcademicSemesterValidationSchema,
};
