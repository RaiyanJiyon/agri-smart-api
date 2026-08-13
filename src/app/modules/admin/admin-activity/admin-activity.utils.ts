import { Types } from 'mongoose';
import { ApiError } from '../../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../../shared/constants/index.js';

export const getObjectId = (id: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid ObjectId.');
  }

  return new Types.ObjectId(id);
};
