import { model, Schema } from 'mongoose';
import type { AdminActivity } from './admin-activity.interface.js';
import { COLLECTION_NAME } from '../../../shared/constants/index.js';
import { ADMIN_ACTIVITY_ACTION } from '../admin.constant.js';

const adminActivitySchema = new Schema<AdminActivity>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: Object.values(ADMIN_ACTIVITY_ACTION),
      required: true,
      index: true,
    },

    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      default: null,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

adminActivitySchema.index({ createdAt: -1 });

export const AdminActivityModel = model<AdminActivity>(
  COLLECTION_NAME.ADMIN_ACTIVITY,
  adminActivitySchema
);
