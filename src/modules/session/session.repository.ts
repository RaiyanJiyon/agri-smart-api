import type { HydratedDocument, Types } from 'mongoose';
import type { ISession } from './session.interface.js';
import { SessionModel } from './session.model.js';
import type { DeleteResult } from 'mongoose';

const getActiveSessionFilter = () => ({
  revokedAt: null,
  expiresAt: {
    $gt: new Date(),
  },
});

const create = async (payload: Omit<ISession, 'revokedAt'>): Promise<ISession> => {
  return SessionModel.create(payload);
};

const findByRefreshTokenHash = async (refreshTokenHash: string): Promise<ISession | null> => {
  return SessionModel.findOne({ refreshTokenHash });
};

const findActiveByRefreshTokenHash = async (
  refreshTokenHash: string
): Promise<HydratedDocument<ISession> | null> => {
  return SessionModel.findOne({
    refreshTokenHash,
    ...getActiveSessionFilter(),
  });
};

const findAllByUserId = async (userId: Types.ObjectId): Promise<ISession[]> => {
  return SessionModel.find({
    userId,
  }).sort({
    createdAt: -1,
  });
};

const findActiveByUserId = async (userId: Types.ObjectId): Promise<ISession[]> => {
  return SessionModel.find({
    userId,
    ...getActiveSessionFilter(),
  }).sort({
    createdAt: -1,
  });
};

const revoke = async (sessionId: Types.ObjectId): Promise<ISession | null> => {
  return SessionModel.findByIdAndUpdate(
    {
      _id: sessionId,
      revokedAt: null,
    },
    {
      revokedAt: new Date(),
    },
    {
      new: true,
    }
  );
};

const revokeAllByUserId = async (userId: Types.ObjectId): Promise<void> => {
  await SessionModel.updateMany(
    {
      _id: userId,
      revokedAt: null,
    },
    {
      revokedAt: new Date(),
      lastUsedAt: new Date(),
    }
  );
};

const revokeAllExcept = async (
  userId: Types.ObjectId,
  sessionIdToKeep: Types.ObjectId
): Promise<void> => {
  await SessionModel.updateMany(
    {
      userId,
      _id: { $ne: sessionIdToKeep },
      revokedAt: null,
    },
    {
      revokedAt: new Date(),
      lastUsedAt: new Date(),
    }
  );
};

const deleteByUserId = async (userId: Types.ObjectId): Promise<DeleteResult> => {
  return SessionModel.deleteMany({
    _id: userId,
  });
};

const rotateRefreshToken = async (
  sessionId: Types.ObjectId,
  refreshTokenHash: string,
  expiresAt: Date
): Promise<ISession | null> => {
  return SessionModel.findOneAndUpdate(
    {
      _id: sessionId,
      revokedAt: null,
    },
    {
      refreshTokenHash,
      expiresAt,
      lastUsedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

export const SessionRepository = {
  create,
  findByRefreshTokenHash,
  findActiveByRefreshTokenHash,
  findAllByUserId,
  findActiveByUserId,
  revoke,
  revokeAllByUserId,
  revokeAllExcept,
  deleteByUserId,
  rotateRefreshToken,
};
