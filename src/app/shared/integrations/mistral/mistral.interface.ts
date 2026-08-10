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

export interface MistralDiseaseDetectionInput {
  imageUrl: string;
}

export interface MistralDiseaseDetectionOutput {
  disease: string;
  explanation: string;
  recommendedActions: string[];
  confidence: number | null;
}
