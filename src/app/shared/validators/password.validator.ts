import z from 'zod';

export const passwordSchema = z
  .string({
    error: 'Password is required.',
  })
  .min(8, 'Password must be at least 8 characters.')
  .max(100, 'Password cannot exceed 100 characters.')
  .regex(
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/,
    'Password must contain at least one uppercase letter, one number, and one special character.'
  );