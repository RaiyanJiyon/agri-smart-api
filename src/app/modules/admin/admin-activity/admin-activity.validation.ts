import z from 'zod';
import { ADMIN_ACTIVITY_ACTION } from '../admin.constant.js';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId.');

export const getAdminActivityValidationSchema = z.object({
  query: z.object({
    adminId: objectIdSchema.optional(),

    targetUserId: objectIdSchema.optional(),

    action: z.enum(Object.values(ADMIN_ACTIVITY_ACTION) as [string, ...string[]]).optional(),

    page: z.coerce.number().int().positive().optional(),

    limit: z.coerce.number().int().positive().max(100).optional(),
  }).strict(),
});

export const getAdminActivityByIdValidationSchema = z.object({
  params: z.object({
    activityId: objectIdSchema,
  }).strict(),
});
