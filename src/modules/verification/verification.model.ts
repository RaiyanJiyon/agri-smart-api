import { model, Schema } from 'mongoose';
import type { IVerification } from './verification.interface.js';
import { VERIFICATION_TYPE } from './verification.constant.js';

const verificationSchema = new Schema<IVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

export const VerificationModel = model<IVerification>('Verification', verificationSchema);
