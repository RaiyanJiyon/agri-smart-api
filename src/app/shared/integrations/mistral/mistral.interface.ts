export interface MistralCropRecommendationInput {
  profileId: string;
  inputParameters: Record<string, unknown>;
}

export interface MistralCropRecommendationOutput {
  recommendedCrops: string[];
  explanation: string;
  confidence: number | null;
}
