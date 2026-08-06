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
      new: true,
      runValidators: true,
    }
  );
};

const findByToken = async (
  tokenHash: string,
  type: VerificationType
): Promise<HydratedDocument<Verification> | null> => {
  return VerificationModel.findOne({
    tokenHash,
    type,
    ...getActiveVerificationFilter(),
  });
};

const findActiveVerification = async (
  userId: Types.ObjectId,
  type: VerificationType
): Promise<HydratedDocument<Verification> | null> => {
  return VerificationModel.findOne({
    userId,
    type,
    ...getActiveVerificationFilter(),
  });
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
      new: true,
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
  findByToken,
  findActiveVerification,
  markAsUsed,
  deleteByUserAndType,
};
