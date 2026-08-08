import z from 'zod';

export const UpdateProfileValidationSchema = z.object({
  body: z
    .object({
      firstName: z
        .string()
        .trim()
        .min(2, 'First name must be at least 2 characters.')
        .max(50, 'First name cannot exceed 50 characters.')
        .optional(),

      lastName: z
        .string()
        .trim()
        .min(2, 'Last name must be at least 2 characters.')
        .max(50, 'Last name cannot exceed 50 characters.')
        .optional(),

      phone: z
        .string()
        .trim()
        .regex(/^01\d{9}$/, 'Please provide a valid Bangladeshi phone number.')
        .optional(),

      avatar: z.string().trim().url('Avatar must be a valid URL.').optional(),

      address: z
        .string()
        .trim()
        .min(5, 'Address must be at least 5 characters.')
        .max(300, 'Address cannot exceed 300 characters.')
        .optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one profile field must be provided.',
    }),
});
