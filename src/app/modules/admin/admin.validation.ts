import { z } from 'zod/v4';
import {
  bloodGroupEnum,
  createUserNameValidationSchema,
  genderEnum,
  updateBloodGroupEnum,
  updateGenderEnum,
  updateUserNameValidationSchema,
} from '../../constants/validation.constant';

export const createAdminValidationSchema = z.object({
  body: z.object({
    password: z.string().max(20).optional(),
    admin: z.object({
      designation: z.string(),
      name: createUserNameValidationSchema,
      gender: genderEnum,
      dateOfBirth: z.string().optional(),
      email: z.email().nonempty('Email is required'),
      contactNo: z.string().nonempty('Contact number is required'),
      emergencyContactNo: z.string(),
      bloodGroup: bloodGroupEnum,
      presentAddress: z.string(),
      permanentAddress: z.string(),
    }),
  }),
});

export const updateAdminValidationSchema = z.object({
  body: z.object({
    admin: z.object({
      designation: z.string().optional(),
      name: updateUserNameValidationSchema.optional(),
      gender: updateGenderEnum.optional(),
      dateOfBirth: z.string().optional(),
      email: z.email().optional(),
      contactNo: z.string().optional(),
      emergencyContactNo: z.string().optional(),
      bloodGroup: updateBloodGroupEnum.optional(),
      presentAddress: z.string().optional(),
      permanentAddress: z.string().optional(),
      profileImg: z.string().optional(),
    }),
  }),
});

export const AdminValidations = {
  createAdminValidationSchema,
  updateAdminValidationSchema,
};
