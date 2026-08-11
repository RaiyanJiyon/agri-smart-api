import { Types } from 'mongoose';
import { ApiError } from '../../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../../shared/constants/httpStatus.js';

export const getConversationObjectId = (conversationId: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid conversation ID.');
  }

  return new Types.ObjectId(conversationId);
};
