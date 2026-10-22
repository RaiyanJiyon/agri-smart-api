import { model, Schema } from 'mongoose';
import type { Session } from './session.interface.js';
import { COLLECTION_NAME } from '../../shared/constants/index.js';

const sessionSchema = new Schema<Session>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      required: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
    },

    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },

    userAgent: {
      type: String,
      required: true,
      trim: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    lastUsedAt: {
      type: Date,
      default: null,
    },

    device: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

sessionSchema.index({
  userId: 1,
});

sessionSchema.index(
  {
    refreshTokenHash: 1,
    revokedAt: 1,
    expiresAt: 1,
  },
  {
    unique: true,
  }
);

sessionSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

export const SessionModel = model<Session>(COLLECTION_NAME.SESSION, sessionSchema);
