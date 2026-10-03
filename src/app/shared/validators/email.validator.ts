import * as z from 'zod';

export const emailSchema = z
  .string({
    error: 'Email is required.',
  })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Invalid email address.' }));
