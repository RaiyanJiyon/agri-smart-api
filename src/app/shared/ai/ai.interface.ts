export interface CropRecommendationAIInput {
  profileId: string;
  inputParameters: Record<string, unknown>;
}

export interface CropRecommendationAIOutput {
  recommendationResult: Record<string, unknown>;
}

export interface AIService {
  generateCropRecommendation(input: CropRecommendationAIInput): Promise<CropRecommendationAIOutput>;
}
