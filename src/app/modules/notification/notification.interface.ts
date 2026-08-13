import type { Types } from 'mongoose';
import type { NotificationStatus, NotificationType } from './notification.constant.js';

export interface Notification {
  userId: Types.ObjectId;

  type: NotificationType;

  status: NotificationStatus;

  title: string;

  message: string;

  metaData: Record<string, unknown>;

  createdAt?: Date;

  updatedAt?: Date;
}
