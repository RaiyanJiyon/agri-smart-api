import type { Types } from 'mongoose';
import type { Notification } from './notification.interface.js';
import { NotificationModel } from './notification.model.js';
import { NOTIFICATION_STATUS } from './notification.constant.js';

const create = async (payload: Notification): Promise<Notification> => {
  const notification = await NotificationModel.create(payload);

  return notification.toObject();
};

const findByUserId = async (
  userId: Types.ObjectId,
  limit: number,
  skip: number
): Promise<Notification[]> => {
  return NotificationModel.find({
    userId,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean<Notification[]>();
};

const countByUserId = async (userId: Types.ObjectId): Promise<number> => {
  return NotificationModel.countDocuments({
    userId,
  });
};

const countUnreadByUserId = async (userId: Types.ObjectId): Promise<number> => {
  return NotificationModel.countDocuments({
    userId,
    status: NOTIFICATION_STATUS.UNREAD,
  });
};

const findById = async (notificationId: Types.ObjectId): Promise<Notification | null> => {
  return NotificationModel.findById(notificationId).lean<Notification | null>();
};

const markAsRead = async (notificationId: Types.ObjectId): Promise<Notification | null> => {
  return NotificationModel.findByIdAndUpdate(
    notificationId,
    {
      status: NOTIFICATION_STATUS.READ,
    },
    {
      runValidators: true,
      new: true,
    }
  ).lean<Notification | null>();
};

const markAllAsRead = async (userId: Types.ObjectId): Promise<void> => {
  await NotificationModel.updateMany(
    {
      userId,
      status: NOTIFICATION_STATUS.UNREAD,
    },
    {
      $set: {
        status: NOTIFICATION_STATUS.READ,
      },
    }
  );
};

const deleteById = async (notificationId: Types.ObjectId): Promise<Notification | null> => {
  return NotificationModel.findByIdAndDelete(notificationId).lean<Notification | null>();
};

export const NotificationRepository = {
  create,
  findByUserId,
  countByUserId,
  countUnreadByUserId,
  findById,
  markAsRead,
  markAllAsRead,
  deleteById,
};
