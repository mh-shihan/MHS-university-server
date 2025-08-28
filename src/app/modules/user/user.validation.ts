import { z } from 'zod/v4';
import { UserStatus } from './user.constant';

const userValidationSchema = z.object({
  password: z
    .string({ error: 'Password Must be string' })
    .max(20, { message: 'Password can not be more than 20 characters' })
    .optional(),
});

const changeStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum([...UserStatus] as [string, ...string[]]),
  }),
});

export const UserValidations = {
  userValidationSchema,
  changeStatusValidationSchema,
};
