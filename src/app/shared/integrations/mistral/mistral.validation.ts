import { z } from 'zod';

export const mistralCropRecommendationResponseSchema = z.object({
  recommendedCrops: z.array(z.string().min(1)),
  explanation: z.string().min(1),
  confidence: z.number().min(0).max(1).nullable(),
});

export type MistralCropRecommendationResponse = z.infer<
  typeof mistralCropRecommendationResponseSchema
>;

export const mistralDiseaseDetectionResponseSchema = z.object({
  disease: z.string().min(1),
  explanation: z.string().min(1),
  recommendedActions: z.array(z.string()),
  confidence: z.number().min(0).max(1).nullable(),
});

export type MistralDiseaseDetectionResponse = z.infer<typeof mistralDiseaseDetectionResponseSchema>;

export const mistralChatResponseSchema = z.object({
  message: z.string().min(1),
});

export type MistralChatResponse = z.infer<typeof mistralChatResponseSchema>;
