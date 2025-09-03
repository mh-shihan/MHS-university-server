import { z } from 'zod/v4';
import { Days, invalidTimeFormat } from './offeredCourse.constant';
import { isValid24HourTime } from './offeredCourse.utils';

const timeStringSchema = z
  .string()
  .refine(isValid24HourTime, { message: invalidTimeFormat }); // HH: MM   00-23: 00-59

const createOfferedCourseValidationSchema = z.object({
  body: z
    .object({
      semesterRegistration: z.string(),
      academicDepartment: z.string(),
      course: z.string(),
      faculty: z.string(),
      section: z.number(),
      maxCapacity: z.number(),
      days: z.array(z.enum([...Days])),
      startTime: timeStringSchema,
      endTime: timeStringSchema,
    })
    .refine(
      ({ startTime, endTime }) => {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        return end > start;
      },
      {
        message: 'Start time should be before End time!',
      },
    ),
});

const updateOfferedCourseValidationSchema = z.object({
  body: z.object({
    faculty: z.string(),
    maxCapacity: z.number(),
    days: z.array(z.enum([...Days])),
    startTime: timeStringSchema,
    endTime: timeStringSchema,
  }),
});

export const OfferedCourseValidations = {
  createOfferedCourseValidationSchema,
  updateOfferedCourseValidationSchema,
};
