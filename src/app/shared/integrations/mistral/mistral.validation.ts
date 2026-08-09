import { z } from 'zod';

export const mistralCropRecommendationResponseSchema = z.object({
  recommendedCrops: z.array(z.string().min(1)),
  explanation: z.string().min(1),
  confidence: z.number().min(0).max(1).nullable(),
});

export type MistralCropRecommendationResponse = z.infer<
  typeof mistralCropRecommendationResponseSchema
>;
