import { Types } from 'mongoose';
import { ApiError } from '../../shared/errors/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';

export const getNotificationObjectId = (notificationId: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid notification ID.');
  }

  return new Types.ObjectId(notificationId);
};
