import type { Types } from 'mongoose';
import type { NotificationStatus, NotificationType } from './notification.constant.js';

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

