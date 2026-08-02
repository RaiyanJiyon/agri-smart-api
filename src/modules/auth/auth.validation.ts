import z from 'zod';
import { emailSchema } from '../../shared/validators/email.validator.js';
import { passwordSchema } from '../../shared/validators/password.validator.js';

export const registerValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters.')
        .max(100, 'Name cannot exceed 100 characters.'),

      email: emailSchema,

      password: passwordSchema,
    })
    .strict(),
});

export const loginValidationSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: z.string().min(1, 'Password is required.'),
    })
    .strict(),
});

export const forgotPasswordValidationSchema = z.object({
  body: z
    .object({
      email: emailSchema,
    })
    .strict(),
});

export const resetPasswordValidationSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, 'Reset token is required.'),

      password: passwordSchema,
    })
    .strict(),
});

export const changePasswordValidationSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required.'),

      newPassword: passwordSchema,
    })
    .strict(),
});
