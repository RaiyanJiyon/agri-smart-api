import z from 'zod';
import { ADMIN_ACTIVITY_ACTION } from '../admin.constant.js';

export const getAdminActivityValidationSchema = z.object({
  query: z.object({
    adminId: z.string().optional(),

    targetUserId: z.string().optional(),

    action: z.enum(Object.values(ADMIN_ACTIVITY_ACTION) as [string, ...string[]]).optional(),

    page: z.coerce.number().int().positive().optional(),

    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const getAdminActivityByIdValidationSchema = z.object({
  params: z.object({
    activityId: z.string().min(1),
  }),
});
