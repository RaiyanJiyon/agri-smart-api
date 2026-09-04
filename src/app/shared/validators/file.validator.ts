import * as z from 'zod';

export const fileSchema = z
  .instanceof(File, {
    error: 'File is required.',
  })
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    error: 'File size must be less than or equal to 5MB.',
  })
  .refine((file) => ['image/jpeg', 'image/png', 'image/gif'].includes(file.type), {
    error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.',
  });
