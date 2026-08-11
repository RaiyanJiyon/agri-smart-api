import z from 'zod';
import { USER_ROLE, USER_STATUS } from '../auth/auth.constant.js';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID.');

export const getUsersValidationSchema = z.object({
  query: z
    .object({
      search: z.string().trim().min(1, 'Search query cannot be empty.').optional(),

      role: z.enum(Object.values(USER_ROLE) as [string, ...string[]]).optional(),

      status: z.enum(Object.values(USER_STATUS) as [string, ...string[]]).optional(),

      page: z.coerce
        .number()
        .int('Page must be an integer.')
        .min(1, 'Page must be at least 1.')
        .optional(),

      limit: z.coerce
        .number()
        .int('Limit must be an integer.')
        .min(1, 'Limit must be at least 1.')
        .max(100, 'Limit cannot exceed 100.')
        .optional(),
    })
    .strict(),
});

export const getUserValidationSchema = z.object({
  params: z
    .object({
      userId: objectIdSchema,
    })
    .strict(),
});

export const updateUserStatusValidationSchema = z.object({
  params: z
    .object({
      userId: objectIdSchema,
    })
    .strict(),

  body: z
    .object({
      status: z.enum(Object.values(USER_STATUS) as [string, ...string[]]),
    })
    .strict(),
});
