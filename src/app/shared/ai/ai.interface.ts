export interface CropRecommendationAIInput {
  profileId: string;
  inputParameters: Record<string, unknown>;
}

export interface CropRecommendationAIOutput {
  recommendationResult: {
    recommendedCrops: string[];
    explanation: string;
    confidence: number | null;
  };
}

export interface AIService {
  generateCropRecommendation(input: CropRecommendationAIInput): Promise<CropRecommendationAIOutput>;
}
