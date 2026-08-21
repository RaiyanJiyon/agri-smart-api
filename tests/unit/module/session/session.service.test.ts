import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionService } from '../../../../src/app/modules/session/session.service.js';

import { hashToken } from '../../../../src/app/shared/utils/crypto.js';
import { SessionRepository } from '../../../../src/app/modules/session/session.repository.js';

vi.mock('../../../../src/app/modules/session/session.repository.js', () => ({
  SessionRepository: {
    create: vi.fn(),
    findByRefreshTokenHash: vi.fn(),
    findActiveByRefreshTokenHash: vi.fn(),
    findAllByUserId: vi.fn(),
    findActiveByUserId: vi.fn(),
    revoke: vi.fn(),
    revokeAllByUserId: vi.fn(),
    revokeAllExcept: vi.fn(),
    deleteByUserId: vi.fn(),
    rotateRefreshToken: vi.fn(),
  },
}));

describe('SessionService.createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a session with a hashed refresh token', async () => {
    const userId = new mongoose.Types.ObjectId();
    const refreshToken = 'raw-refresh-token';
    const expiresAt = new Date();

    const createdSession = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt,
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(SessionRepository.create).mockResolvedValue(createdSession);

    const result = await SessionService.createSession({
      userId,
      refreshToken,
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt,
    });

    expect(SessionRepository.create).toHaveBeenCalledWith({
      userId,
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt,
    });

    expect(SessionRepository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken,
      })
    );

    expect(result).toEqual(createdSession);
  });

  it('should use default values for missing ipAddress and userAgent', async () => {
    const userId = new mongoose.Types.ObjectId();
    const refreshToken = 'raw-refresh-token';
    const expiresAt = new Date();

    const createdSession = {
      _id: new mongoose.Types.ObjectId(),
      userId,
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: '',
      userAgent: 'unknown',
      expiresAt,
      revokedAt: null,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(SessionRepository.create).mockResolvedValue(createdSession);

    const result = await SessionService.createSession({
      userId,
      refreshToken,
      expiresAt,
    });

    expect(SessionRepository.create).toHaveBeenCalledWith({
      userId,
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: '',
      userAgent: 'unknown',
      expiresAt,
    });

    expect(result).toEqual(createdSession);
  });
});

describe('SessionService.findActiveSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find an active session using the hashed refresh token', async () => {
    const refreshToken = 'raw-refresh-token';

    const session = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(),
      revokedAt: null,
    };

    vi.mocked(SessionRepository.findActiveByRefreshTokenHash).mockResolvedValue(session as never);

    const result = await SessionService.findActiveSession(refreshToken);

    expect(SessionRepository.findActiveByRefreshTokenHash).toHaveBeenCalledWith(
      hashToken(refreshToken)
    );

    expect(SessionRepository.findActiveByRefreshTokenHash).not.toHaveBeenCalledWith(refreshToken);

    expect(result).toEqual(session);
  });

  it('should return null when no active session exists', async () => {
    const refreshToken = 'invalid-refresh-token';

    vi.mocked(SessionRepository.findActiveByRefreshTokenHash).mockResolvedValue(null);

    const result = await SessionService.findActiveSession(refreshToken);

    expect(SessionRepository.findActiveByRefreshTokenHash).toHaveBeenCalledWith(
      hashToken(refreshToken)
    );

    expect(result).toBeNull();
  });
});

describe('SessionService.revokeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should revoke a session by its id', async () => {
    const sessionId = new mongoose.Types.ObjectId();

    const revokedSession = {
      _id: sessionId,
      userId: new mongoose.Types.ObjectId(),
      refreshTokenHash: 'hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(),
      revokedAt: new Date(),
    };

    vi.mocked(SessionRepository.revoke).mockResolvedValue(revokedSession);

    const result = await SessionService.revokeSession(sessionId);

    expect(SessionRepository.revoke).toHaveBeenCalledWith(sessionId);
    expect(result).toEqual(revokedSession);
  });

  it('should return null when the session does not exist', async () => {
    const sessionId = new mongoose.Types.ObjectId();

    vi.mocked(SessionRepository.revoke).mockResolvedValue(null);

    const result = await SessionService.revokeSession(sessionId);

    expect(SessionRepository.revoke).toHaveBeenCalledWith(sessionId);
    expect(result).toBeNull();
  });
});

describe('SessionService.revokeAllSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should revoke all sessions belonging to a user', async () => {
    const userId = new mongoose.Types.ObjectId();

    vi.mocked(SessionRepository.revokeAllByUserId).mockResolvedValue(undefined);

    await SessionService.revokeAllSessions(userId);

    expect(SessionRepository.revokeAllByUserId).toHaveBeenCalledWith(userId);
    expect(SessionRepository.revokeAllByUserId).toHaveBeenCalledTimes(1);
  });

  it('should propagate repository errors', async () => {
    const userId = new mongoose.Types.ObjectId();
    const error = new Error('Database error');

    vi.mocked(SessionRepository.revokeAllByUserId).mockRejectedValue(error);

    await expect(SessionService.revokeAllSessions(userId)).rejects.toThrow('Database error');

    expect(SessionRepository.revokeAllByUserId).toHaveBeenCalledWith(userId);
  });
});

describe('SessionService.revokeAllExcept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should revoke all sessions except the specified session', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sessionIdToKeep = new mongoose.Types.ObjectId();

    vi.mocked(SessionRepository.revokeAllExcept).mockResolvedValue(undefined);

    await SessionService.revokeAllExcept(userId, sessionIdToKeep);

    expect(SessionRepository.revokeAllExcept).toHaveBeenCalledWith(userId, sessionIdToKeep);

    expect(SessionRepository.revokeAllExcept).toHaveBeenCalledTimes(1);
  });

  it('should propagate repository errors', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sessionIdToKeep = new mongoose.Types.ObjectId();
    const error = new Error('Database error');

    vi.mocked(SessionRepository.revokeAllExcept).mockRejectedValue(error);

    await expect(SessionService.revokeAllExcept(userId, sessionIdToKeep)).rejects.toThrow(
      'Database error'
    );
  });
});

describe('SessionService.rotateRefreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should rotate the refresh token using its hash', async () => {
    const sessionId = new mongoose.Types.ObjectId();
    const refreshToken = 'new-refresh-token';
    const expiresAt = new Date();

    const rotatedSession = {
      _id: sessionId,
      userId: new mongoose.Types.ObjectId(),
      refreshTokenHash: hashToken(refreshToken),
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt,
      revokedAt: null,
      lastUsedAt: new Date(),
    };

    vi.mocked(SessionRepository.rotateRefreshToken).mockResolvedValue(rotatedSession);

    const result = await SessionService.rotateRefreshToken(sessionId, refreshToken, expiresAt);

    expect(SessionRepository.rotateRefreshToken).toHaveBeenCalledWith(
      sessionId,
      hashToken(refreshToken),
      expiresAt
    );

    expect(SessionRepository.rotateRefreshToken).not.toHaveBeenCalledWith(
      sessionId,
      refreshToken,
      expiresAt
    );

    expect(result).toEqual(rotatedSession);
  });

  it('should return null when the session cannot be rotated', async () => {
    const sessionId = new mongoose.Types.ObjectId();
    const refreshToken = 'new-refresh-token';
    const expiresAt = new Date();

    vi.mocked(SessionRepository.rotateRefreshToken).mockResolvedValue(null);

    const result = await SessionService.rotateRefreshToken(sessionId, refreshToken, expiresAt);

    expect(SessionRepository.rotateRefreshToken).toHaveBeenCalledWith(
      sessionId,
      hashToken(refreshToken),
      expiresAt
    );

    expect(result).toBeNull();
  });
});
