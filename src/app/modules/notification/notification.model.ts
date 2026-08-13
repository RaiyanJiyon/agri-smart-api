import { model, Schema } from 'mongoose';
import type { Notification } from './notification.interface.js';
import { NOTIFICATION_STATUS, NOTIFICATION_TYPE } from './notification.constant.js';
import { COLLECTION_NAME } from '../../shared/constants/database.js';

const notificationSchema = new Schema<Notification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUS),
      required: true,
      default: NOTIFICATION_STATUS.UNREAD,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

notificationSchema.index({
  userId: 1,
  status: 1,
  createdAt: -1,
});

export const NotificationModel = model<Notification>(
  COLLECTION_NAME.NOTIFICATION,
  notificationSchema
);
