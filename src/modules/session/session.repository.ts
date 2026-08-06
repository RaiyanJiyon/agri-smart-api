import type { HydratedDocument, Types } from 'mongoose';
import type { Session } from './session.interface.js';
import { SessionModel } from './session.model.js';
import type { DeleteResult } from 'mongoose';

const getActiveSessionFilter = () => ({
  revokedAt: null,
  expiresAt: {
    $gt: new Date(),
  },
});

const create = async (payload: Omit<Session, 'revokedAt'>): Promise<Session> => {
  return SessionModel.create(payload);
};

/**
 * * FUTURE / UTILITY: Find a single session document by its refresh token hash.
 * * Unlike active-only queries, this retrieves the session regardless of its 
 * * expiration or revocation status. Reserved for specialized security checks, 
 * * auditing, or debugging flows.
 */
const findByRefreshTokenHash = async (refreshTokenHash: string): Promise<HydratedDocument<Session> | null> => {
  return SessionModel.findOne({
    refreshTokenHash,
  });
};

const findActiveByRefreshTokenHash = async (
  refreshTokenHash: string
): Promise<HydratedDocument<Session> | null> => {
  return SessionModel.findOne({
    refreshTokenHash,
    ...getActiveSessionFilter(),
  });
};

/**
 * * FUTURE: Retrieve only active, non-revoked sessions for a user.
 * * Will be used for the "Active Devices" dashboard where users 
 * * can view all currently logged-in browsers/devices.
 */
const findAllByUserId = async (userId: Types.ObjectId): Promise<Session[]> => {
  return SessionModel.find({
    userId,
  }).sort({
    createdAt: -1,
  });
};

/**
 * * FUTURE: Retrieve only active, non-revoked sessions for a user.
 * * Will be used for the "Active Devices" dashboard where users 
 * * can view and manage all currently logged-in browsers or devices.
 */
const findActiveByUserId = async (userId: Types.ObjectId): Promise<Session[]> => {
  return SessionModel.find({
    userId,
    ...getActiveSessionFilter(),
  }).sort({
    createdAt: -1,
  });
};

const revoke = async (sessionId: Types.ObjectId): Promise<Session | null> => {
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
      userId: userId,
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

/**
 * * FUTURE: Delete all sessions associated with a specific user.
 * * Will be used during the account deletion flow (GDPR compliance / "Delete Account") 
 * * to clean up and remove all orphaned session records from the database.
 */
const deleteByUserId = async (userId: Types.ObjectId): Promise<DeleteResult> => {
  return SessionModel.deleteMany({
    userId: userId,
  });
};

const rotateRefreshToken = async (
  sessionId: Types.ObjectId,
  refreshTokenHash: string,
  expiresAt: Date
): Promise<Session | null> => {
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
