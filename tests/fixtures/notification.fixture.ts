import mongoose from 'mongoose';
import type { Notification } from '../../src/app/modules/notification/notification.interface.js';
import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
} from '../../src/app/modules/notification/notification.constant.js';

export interface MockNotification extends Notification {
  _id: mongoose.Types.ObjectId;
}

export const createMockNotification = (
  overrides: Partial<MockNotification> = {}
): MockNotification => {
  const notificationId = overrides._id ?? new mongoose.Types.ObjectId();
  const userId = overrides.userId ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();

  const base: MockNotification = {
    _id: notificationId,
    userId,
    type: NOTIFICATION_TYPE.SYSTEM,
    status: NOTIFICATION_STATUS.UNREAD,
    title: 'System Notification',
    message: 'Your account has been updated.',
    metadata: {},
    createdAt: defaultDate,
    updatedAt: defaultDate,
    ...overrides,
  };

  return base;
};

export const createMockNotificationList = (
  count = 3,
  overrides: Partial<MockNotification> = {}
): MockNotification[] => {
  return Array.from({ length: count }, () => createMockNotification({ ...overrides }));
};
