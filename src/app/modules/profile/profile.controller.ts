import { Types } from 'mongoose';
import type { Request, Response } from 'express';
import { catchAsync, sendResponse } from '../../shared/utils/index.js';
import { ApiError } from '../../shared/errors/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { ProfileService } from './profile.service.js';
import type { UpdateProfileBody } from './profile.interface.js';

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid user identity.');
  }

  const objectId = new Types.ObjectId(userId);

  const data = await ProfileService.getMyProfile(objectId);

  sendResponse(res, {
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: 'Profile retrieved successfully.',
    data: data,
  });
});

const updateMyProfile = catchAsync(
  async (req: Request<unknown, unknown, UpdateProfileBody>, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid user identity.');
    }

    const objectId = new Types.ObjectId(userId);

    const payload = req.body;
    const data = await ProfileService.updateMyProfile(objectId, payload);

    sendResponse(res, {
      success: true,
      statusCode: HTTP_STATUS.OK,
      message: 'Profile updated successfully.',
      data: data,
    });
  }
);

export const ProfileController = {
  getMyProfile,
  updateMyProfile,
};
