import type { DeleteResult, HydratedDocument, Types } from 'mongoose';
import type {
  CreateVerification,
  Verification,
  VerificationType,
} from './verification.interface.js';
import { VerificationModel } from './verification.model.js';

const getActiveVerificationFilter = () => ({
  usedAt: null,
  expiresAt: {
    $gt: new Date(),
  },
});

const createOrReplace = async (
  payload: CreateVerification
): Promise<HydratedDocument<Verification>> => {
  return VerificationModel.findOneAndUpdate(
    {
      userId: payload.userId,
      type: payload.type,
    },
    payload,
    {
      upsert: true,
      returnDocument: 'after',
      runValidators: true,
    }
  );
};

const findActiveVerificationByHash = async (
  tokenHash: string,
  type: VerificationType
): Promise<HydratedDocument<Verification> | null> => {
  return VerificationModel.findOne({
    tokenHash,
    type,
    ...getActiveVerificationFilter(),
  });
};

const consumeToken = async (
  tokenHash: string,
  type: VerificationType
): Promise<HydratedDocument<Verification> | null> => {
  return VerificationModel.findOneAndUpdate(
    {
      tokenHash,
      type,
      ...getActiveVerificationFilter(),
    },
    {
      $set: { usedAt: new Date() }, // Ensures it's not already used and not expired
    },
    {
      returnDocument: 'after',
    }
  );
};

const markAsUsed = async (id: Types.ObjectId): Promise<HydratedDocument<Verification> | null> => {
  return VerificationModel.findOneAndUpdate(
    {
      _id: id,
      usedAt: null,
    },
    {
      usedAt: new Date(),
    },
    {
      returnDocument: 'after',
    }
  );
};

const deleteByUserAndType = async (
  userId: Types.ObjectId,
  type: VerificationType
): Promise<DeleteResult> => {
  return VerificationModel.deleteOne({
    userId,
    type,
  });
};

export const VerificationRepository = {
  createOrReplace,
  findActiveVerificationByHash,
  consumeToken,
  markAsUsed,
  deleteByUserAndType,
};
