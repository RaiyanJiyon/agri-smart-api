import type { Request, Response } from 'express';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { CropRecommendationService } from './crop-recommendation.service.js';
import { sendResponse } from '../../shared/utils/sendResponse.js';
import type { CreateCropRecommendationPayload } from './crop-recommendation.interface.js';
import { Types } from 'mongoose';

const createCropRecommendation = catchAsync(
  async (req: Request<unknown, unknown, CreateCropRecommendationPayload>, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
    }

    const { profileId, inputParameters } = req.body;

    if (!Types.ObjectId.isValid(profileId)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid profile ID.');
    }

    const payload: CreateCropRecommendationPayload = {
      profileId: new Types.ObjectId(profileId),
      inputParameters,
    };

    const data = await CropRecommendationService.createCropRecommendation(
      new Types.ObjectId(userId),
      payload
    );

    sendResponse(res, {
      success: true,
      statusCode: HTTP_STATUS.CREATED,
      message: 'Crop recommendation generated successfully.',
      data,
    });
  }
);

const getMyRecommendations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
  }

  const data = await CropRecommendationService.getMyRecommendations(new Types.ObjectId(userId));

  sendResponse(res, {
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: 'Crop recommendations retrieved successfully.',
    data,
  });
});

const getMyRecommendation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
  }

  const { recommendationId } = req.params as { recommendationId: string };

  if (!recommendationId || !Types.ObjectId.isValid(recommendationId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid recommendation ID.');
  }

  const data = await CropRecommendationService.getMyRecommendation(
    new Types.ObjectId(recommendationId),
    new Types.ObjectId(userId)
  );

  sendResponse(res, {
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: 'Crop recommendation retrieved successfully.',
    data,
  });
});

const deleteMyRecommendation = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
  }

  const { recommendationId } = req.params as { recommendationId: string };

  if (!recommendationId || !Types.ObjectId.isValid(recommendationId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid recommendation ID.');
  }

  await CropRecommendationService.deleteMyRecommendation(
    new Types.ObjectId(recommendationId),
    new Types.ObjectId(userId)
  );

  sendResponse(res, {
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: 'Crop recommendation deleted successfully.',
    data: null,
  });
});

export const CropRecommendationController = {
  createCropRecommendation,
  getMyRecommendations,
  getMyRecommendation,
  deleteMyRecommendation,
};
