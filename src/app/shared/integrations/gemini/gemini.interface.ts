export interface GeminiCropRecommendationInput {
  profileId: string;
  inputParameters: Record<string, unknown>;
}

export interface GeminiCropRecommendationOutput {
  recommendedCrops: string[];
  explanation: string;
  confidence: number | null;
}
