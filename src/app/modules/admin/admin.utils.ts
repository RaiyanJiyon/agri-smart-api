import { Types } from 'mongoose';
import { ApiError } from '../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';

export const getAdminUserObjectId = (userId: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid user ID.');
  }

  return new Types.ObjectId(userId);
};
