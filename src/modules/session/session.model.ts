import { model, Schema } from 'mongoose';
import type { Session } from './session.interface.js';
import { COLLECTION_NAME } from '../../constants/database.js';

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

/**
 * Automatically remove expired sessions.
 *
 * NOTE:
 * MongoDB's TTL monitor runs approximately every 60 seconds,
 * so deletion is not immediate.
 */

sessionSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
  }
);

// Quickly find all sessions for a user.
sessionSchema.index({
  userId: 1,
});

// Quickly find a session by refresh token hash.
sessionSchema.index(
  {
    refreshTokenHash: 1,
  },
  {
    unique: true,
  }
);

export const SessionModel = model<Session>(COLLECTION_NAME.SESSION, sessionSchema);
