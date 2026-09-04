import type { CropRecommendationInput } from '../../modules/crop-recommendations/index.js';

export interface DiseaseDetectionJobData {
  reportId: string;
  userId: string;
  profileId: string;
  imageUrl: string;
  imagePublicId: string;
}

export interface CropRecommendationJobData {
  recommendationId: string;
  userId: string;
  profileId: string;
  inputParameters: CropRecommendationInput;
}
