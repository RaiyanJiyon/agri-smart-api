import type { HydratedDocument, Types } from 'mongoose';
import { hashToken } from '../../shared/utils/index.js';
import type { CreateSession, Session } from './session.interface.js';
import { SessionRepository } from './session.repository.js';

const createSession = async (payload: CreateSession): Promise<Session> => {
  return SessionRepository.create({
    userId: payload.userId,

    refreshTokenHash: hashToken(payload.refreshToken),

    ipAddress: payload.ipAddress ?? '',

    userAgent: payload.userAgent ?? 'unknown',

    expiresAt: payload.expiresAt,
  });
};

const findActiveSession = async (
  refreshToken: string
): Promise<HydratedDocument<Session> | null> => {
  const refreshTokenHash = hashToken(refreshToken);

  return SessionRepository.findActiveByRefreshTokenHash(refreshTokenHash);
};

const revokeSession = async (sessionId: Types.ObjectId): Promise<Session | null> => {
  return SessionRepository.revoke(sessionId);
};

const revokeAllSessions = async (userId: Types.ObjectId): Promise<void> => {
  await SessionRepository.revokeAllByUserId(userId);
};

const revokeAllExcept = async (
  userId: Types.ObjectId,
  sessionIdToKeep: Types.ObjectId
): Promise<void> => {
  await SessionRepository.revokeAllExcept(userId, sessionIdToKeep);
};

const rotateRefreshToken = async (
  sessionId: Types.ObjectId,
  refreshToken: string,
  expiresAt: Date
): Promise<Session | null> => {
  return SessionRepository.rotateRefreshToken(sessionId, hashToken(refreshToken), expiresAt);
};

export const SessionService = {
  createSession,
  findActiveSession,
  revokeSession,
  revokeAllSessions,
  revokeAllExcept,
  rotateRefreshToken,
};
