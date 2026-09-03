import { model, Schema } from 'mongoose';
import type { Verification } from './verification.interface.js';
import { VERIFICATION_TYPE } from './verification.constant.js';
import { COLLECTION_NAME } from '../../shared/constants/index.js';

const verificationSchema = new Schema<Verification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      required: true,
    },

    type: {
      type: String,
      enum: Object.values(VERIFICATION_TYPE),
      required: true,
    },

    tokenHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

verificationSchema.index(
  {
    userId: 1,
    type: 1,
  },
  {
    unique: true,
  }
);

verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationModel = model<Verification>(
  COLLECTION_NAME.VERIFICATION,
  verificationSchema
);
