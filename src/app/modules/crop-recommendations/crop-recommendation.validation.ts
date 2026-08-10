import { z } from 'zod';

const cropRecommendationInputSchema = z
  .object({
    location: z.string().min(1, 'Location is required.'),

    fieldArea: z.number().positive('Field area must be greater than 0.'),

    soilType: z.string().min(1, 'Soil type is required.'),

    soilPh: z
      .number()
      .min(0, 'Soil pH cannot be less than 0.')
      .max(14, 'Soil pH cannot be greater than 14.'),

    nitrogen: z.number().nonnegative('Nitrogen cannot be negative.'),

    phosphorus: z.number().nonnegative('Phosphorus cannot be negative.'),

    potassium: z.number().nonnegative('Potassium cannot be negative.'),

    averageTemperature: z.number(),

    annualRainfall: z.number().nonnegative('Annual rainfall cannot be negative.'),
  })
  .strict();

export const createCropRecommendationValidationSchema = z.object({
  body: z
    .object({
      profileId: z.string().min(1, 'Profile ID is required.'),

      inputParameters: cropRecommendationInputSchema,
    })
    .strict(),
});
