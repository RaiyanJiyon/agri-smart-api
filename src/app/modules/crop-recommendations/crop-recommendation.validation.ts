import z from 'zod';

export const createCropRecommendationValidationSchema = z.object({
  body: z
    .object({
      profileId: z.string().min(1, 'Profile ID is required.'),

      inputParameters: z
        .record(z.string(), z.string())
        .refine((value) => Object.keys(value).length > 0, 'Input parameters are required.'),
    })
    .strict(),
});
