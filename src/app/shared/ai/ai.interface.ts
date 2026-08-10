import type { CropRecommendationInput } from '../../modules/crop-recommendations/index.js';

export interface CropRecommendationAIInput {
  profileId: string;
  inputParameters: CropRecommendationInput;
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
