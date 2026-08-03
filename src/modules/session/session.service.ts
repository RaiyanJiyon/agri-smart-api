import type { Types } from 'mongoose';
import { hashToken } from '../../utils/crypto.js';
import type { ICreateSession, ISession } from './session.interface.js';
import { SessionRepository } from './session.repository.js';

const createSession = async (payload: ICreateSession): Promise<ISession> => {
  return SessionRepository.create(payload);
};

const findActiveSession = async (refreshToken: string): Promise<ISession | null> => {
  const refreshTokenHash = hashToken(refreshToken);

  return SessionRepository.findActiveByRefreshTokenHash(refreshTokenHash);
};

const revokeSession = async (userId: Types.ObjectId): Promise<ISession | null> => {
  return SessionRepository.revoke(userId);
};

const revokeAllSessions = async (userId: Types.ObjectId): Promise<void> => {
  await SessionRepository.revokeAllByUserId(userId);
};

export const SessionService = {
  createSession,
  findActiveSession,
  revokeSession,
  revokeAllSessions,
};
