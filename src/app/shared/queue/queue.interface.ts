import type { CropRecommendationInput } from '../../modules/crop-recommendations/crop-recommendation.interface.js';

export interface DiseaseDetectionJobData {
  reportId: string;
  userId: string;
  profileId: string;
  imageUrl: string;
  imagePublicId: string;
}

export interface CropRecommendationJobData {
  userId: string;
  profileId: string;
  inputParameters: CropRecommendationInput;
}
