import type { Types } from 'mongoose';
import type {
  CreateCropRecommendationPayload,
  CropRecommendation,
} from './crop-recommendation.interface.js';
import { ProfileRepository } from '../profile/profile.repository.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { aiService } from '../../shared/ai/ai.service.js';
import { CropRecommendationRepository } from './crop-recommendation.repository.js';
import { CROP_RECOMMENDATION_STATUS } from './crop-recommendation.constant.js';

const createCropRecommendation = async (
  userId: Types.ObjectId,
  payload: CreateCropRecommendationPayload
) => {
  const profile = await ProfileRepository.findByUserId(userId);

  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Profile not found.');
  }

  // Cast profile to include Mongoose's Document properties
  const profileDoc = profile as unknown as { _id: Types.ObjectId };

  if (profileDoc._id.toString() !== payload.profileId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to use this profile.');
  }

  const aiResult = await aiService.generateCropRecommendation({
    profileId: payload.profileId.toString(),
    inputParameters: payload.inputParameters,
  });

  if (!aiResult?.recommendationResult) {
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to generate crop recommendation.'
    );
  }

  const recommendation = await CropRecommendationRepository.create({
    userId,
    profileId: payload.profileId,
    inputParameters: payload.inputParameters,
    recommendationResult: aiResult.recommendationResult,
    processingStatus: CROP_RECOMMENDATION_STATUS.COMPLETED,
    requestedAt: new Date(),
    completedAt: new Date(),
  });

  return recommendation;
};

const getMyRecommendations = async (userId: Types.ObjectId): Promise<CropRecommendation[]> => {
  return CropRecommendationRepository.findByUserId(userId);
};

const getMyRecommendation = async (
  recommendationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<CropRecommendation | null> => {
  const recommendation = await CropRecommendationRepository.findByIdAndUserId(
    recommendationId,
    userId
  );

  if (!recommendation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Crop recommendation not found.');
  }

  return recommendation;
};

const deleteMyRecommendation = async (recommendationId: Types.ObjectId, userId: Types.ObjectId) => {
  const recommendation = await CropRecommendationRepository.deleteByIdAndUserId(
    recommendationId,
    userId
  );

  if (!recommendation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Crop recommendation not found.');
  }
};

export const CropRecommendationService = {
  createCropRecommendation,
  getMyRecommendations,
  getMyRecommendation,
  deleteMyRecommendation,
};
