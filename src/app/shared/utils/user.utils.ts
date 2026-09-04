import type { Request } from 'express';
import { Types } from 'mongoose';
import { ApiError } from '../errors/index.js';
import { HTTP_STATUS } from '../constants/index.js';

export const getUserObjectId = (req: Pick<Request, 'user'>): Types.ObjectId => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid user identity.');
  }

  return new Types.ObjectId(userId);
};
