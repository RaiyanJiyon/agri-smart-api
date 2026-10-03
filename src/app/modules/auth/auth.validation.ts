import z from 'zod';
import { emailSchema, passwordSchema } from '../../shared/validators/index.js';
import { nameSchema } from '../../shared/validators/name.validator.js';

export const registerValidationSchema = z.object({
  body: z
    .object({
      name: nameSchema,

      email: emailSchema,

      password: passwordSchema,
    })
    .strict(),
});

export const verifyEmailValidationSchema = z.object({
  body: z
    .object({
      token: z
        .string({
          error: 'Verification token is required.',
        })
        .min(1, 'Verification token is required.'),
    })
    .strict(),
});

export const resendVerificationEmailValidationSchema = z.object({
  body: z
    .object({
      email: emailSchema,
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

      newPassword: passwordSchema,
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
