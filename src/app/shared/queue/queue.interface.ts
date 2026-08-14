import type { Types } from 'mongoose';
import type { CropRecommendationInput } from '../../modules/crop-recommendations/crop-recommendation.interface.js';

export interface DiseaseDetectionJobData {
  reportId: Types.ObjectId;

  userId: Types.ObjectId;
  profileId: Types.ObjectId;

  imageUrl: string;
  imagePublicId: string;
}

export interface CropRecommendationJobData {
  userId: Types.ObjectId;
  profileId: Types.ObjectId;

  inputParameters: CropRecommendationInput;
}
