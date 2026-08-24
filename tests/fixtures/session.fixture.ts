import mongoose from 'mongoose';
import type { Session } from '../../src/app/modules/session/session.interface.js';

export interface MockSession extends Session {
  _id: mongoose.Types.ObjectId;
}

export const createMockSession = (overrides: Partial<MockSession> = {}): MockSession => {
  const sessionId = overrides._id ?? new mongoose.Types.ObjectId();
  const userId = overrides.userId ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();
  const futureExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    _id: sessionId,
    userId,
    refreshTokenHash: 'mockHashedRefreshTokenHash1234567890abcdef',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (TestRunner)',
    expiresAt: futureExpiry,
    revokedAt: null,
    lastUsedAt: defaultDate,
    device: 'Desktop Browser',
    ...overrides,
  };
};
