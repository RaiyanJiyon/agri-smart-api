import type { Types } from 'mongoose';
import type { CropRecommendationStatus } from './crop-recommendation.constant.js';

export interface CropRecommendation {
  userId: Types.ObjectId;

  profileId: Types.ObjectId;

  inputParameters: Record<string, unknown>;

  recommendationResult?: Record<string, unknown>;

  processingStatus: CropRecommendationStatus;

  requestedAt: Date;

  completedAt?: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export interface CreateCropRecommendationPayload {
  profileId: Types.ObjectId;

  inputParameters: Record<string, unknown>;
}

export interface CropRecommendationAIResult {
  recommendationResult: Record<string, unknown>;
}