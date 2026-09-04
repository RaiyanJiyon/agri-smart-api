import * as z from 'zod';

export const phoneSchema = z
  .string({
    error: 'Phone number is required.',
  })
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format.');
