import type { CropRecommendationInput } from '../../../modules/crop-recommendations/crop-recommendation.interface.js';

export interface MistralCropRecommendationInput {
  profileId: string;
  inputParameters: CropRecommendationInput;
}

export interface MistralCropRecommendationOutput {
  recommendedCrops: string[];
  explanation: string;
  confidence: number | null;
}
