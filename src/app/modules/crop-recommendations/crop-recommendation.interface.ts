import type { Types } from 'mongoose';

import type { CropRecommendationStatus } from './crop-recommendation.constant.js';

export interface CropRecommendationInput {
  location: string;
  fieldArea: number;
  soilType: string;
  soilPh: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  averageTemperature: number;
  annualRainfall: number;
}

export interface CropRecommendation {
  userId: Types.ObjectId;
  profileId: Types.ObjectId;
  inputParameters: CropRecommendationInput;

  recommendationResult?: {
    recommendedCrops: string[];
    explanation: string;
    confidence: number | null;
  };

  processingStatus: CropRecommendationStatus;

  requestedAt: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCropRecommendationPayload {
  profileId: Types.ObjectId;
  inputParameters: CropRecommendationInput;
}
