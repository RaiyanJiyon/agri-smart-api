import type { Types } from 'mongoose';
import type { Notification, NotificationListResult } from './notification.interface.js';
import { NotificationRepository } from './notification.repository.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { NOTIFICATION_STATUS } from './notification.constant.js';

const create = async (payload: Notification): Promise<Notification> => {
  return NotificationRepository.create(payload);
};

const getByUserId = async (
  userId: Types.ObjectId,
  page = 1,
  limit = 20
): Promise<NotificationListResult> => {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    NotificationRepository.findByUserId(userId, limit, skip),

    NotificationRepository.countByUserId(userId),

    NotificationRepository.countUnreadByUserId(userId),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  };
};

const getById = async (
  notificationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Notification> => {
  const notification = await NotificationRepository.findById(notificationId);

  if (!notification) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found.');
  }

  if (!notification.userId.equals(userId)) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You are not allowed to access this notification.');
  }

  return notification;
};

const markAsRead = async (
  notificationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Notification> => {
  const notification = await getById(notificationId, userId);

  if (notification.status === NOTIFICATION_STATUS.READ) {
    return notification;
  }

  const updatedNotification = await NotificationRepository.markAsRead(notificationId);

  if (!updatedNotification) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found.');
  }

  return updatedNotification;
};

const markAllAsRead = async (userId: Types.ObjectId): Promise<void> => {
  await NotificationRepository.markAllAsRead(userId);
};

const deleteNotification = async (
  notificationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Notification> => {
  await getById(notificationId, userId);

  const deletedNotification = await NotificationRepository.deleteById(notificationId);

  if (!deletedNotification) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Notification not found.');
  }

  return deletedNotification;
};

export const NotificationService = {
  create,
  getByUserId,
  getById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
