import z from 'zod';
import { objectIdSchema } from '../../shared/validators/object-id.validator.js';

export const getNotificationsValidationSchema = z.object({
  query: z
    .object({
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

export const notificationIdValidationSchema = z.object({
  params: z
    .object({
      notificationId: objectIdSchema,
    })
    .strict(),
});
