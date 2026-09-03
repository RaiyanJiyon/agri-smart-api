import { Types } from 'mongoose';
import { ApiError } from '../../shared/errors/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';

export const getFarmObjectId = (farmId: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(farmId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid farm ID.');
  }

  return new Types.ObjectId(farmId);
};
