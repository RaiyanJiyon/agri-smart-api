import z from 'zod';

export const createDiseaseDetectionValidationSchema = z.object({
  body: z
    .object({
      profileId: z.string().min(1, 'Profile ID is required.'),
    })
    .strict(),
});
