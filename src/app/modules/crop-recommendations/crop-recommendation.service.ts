import type { Types } from 'mongoose';
import type {
  CreateCropRecommendationPayload,
  CropRecommendation,
} from './crop-recommendation.interface.js';
import { ProfileRepository } from '../profile/index.js';
import { ApiError } from '../../shared/errors/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { CropRecommendationRepository } from './crop-recommendation.repository.js';
import { CROP_RECOMMENDATION_STATUS } from './crop-recommendation.constant.js';
import { addCropRecommendationJob } from '../../jobs/crop-recommendation/crop-recommendation.queue.js';
import { logger } from '../../shared/utils/index.js';

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

  try {
    const recommendation = await CropRecommendationRepository.create({
      userId,
      profileId: payload.profileId,
      inputParameters: payload.inputParameters,
      processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
      requestedAt: new Date(),
    });

    const recommendationDoc = recommendation as unknown as { _id: Types.ObjectId };

    await addCropRecommendationJob({
      recommendationId: recommendationDoc._id.toString(),
      userId: userId.toString(),
      profileId: payload.profileId.toString(),
      inputParameters: payload.inputParameters,
    });

    return recommendation;
  } catch (error: unknown) {
    logger.error(
      `[CropRecommendationService] Failed to create crop recommendation: ${error instanceof Error ? error.message : String(error)}`
    );
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to create crop recommendation.');
  }
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
