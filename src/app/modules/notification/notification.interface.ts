import type { Types } from 'mongoose';
import type { NOTIFICATION_STATUS, NOTIFICATION_TYPE } from './notification.constant.js';

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

export interface Notification {
  userId: Types.ObjectId;

  type: NotificationType;

  status: NotificationStatus;

  title: string;

  message: string;

  metadata: Record<string, unknown>;

  createdAt?: Date;

  updatedAt?: Date;
}

export interface NotificationListResult {
  notifications: Notification[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  unreadCount: number;
}
