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

  // tests go here
});

describe('SessionService.revokeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});

describe('SessionService.revokeAllSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});

describe('SessionService.revokeAllExcept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});

describe('SessionService.rotateRefreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});
