import z from 'zod/v4';

const loginValidationSchema = z.object({
  body: z.object({
    id: z.string({ error: 'ID is required' }),
    password: z.string({ error: 'Password id required' }),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string({ error: 'Old password is required' }),
    newPassword: z.string({ error: 'Password is required' }),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ error: 'Refresh token is required!' }),
  }),
});

const forgatPasswordValidationSchema = z.object({
  body: z.object({
    id: z.string({ error: 'User ID is required!' }),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    id: z.string({
      error: 'User id is required!',
    }),
    newPassword: z.string({
      error: 'User password is required!',
    }),
  }),
});

export const AuthValidation = {
  loginValidationSchema,
  changePasswordValidationSchema,
  refreshTokenValidationSchema,
  forgatPasswordValidationSchema,
  resetPasswordValidationSchema,
};
