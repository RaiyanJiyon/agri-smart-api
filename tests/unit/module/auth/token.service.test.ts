import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

import { TokenService } from '../../../../src/app/modules/auth/token.service.js';
import { AuthRepository } from '../../../../src/app/modules/auth/auth.repository.js';
import { SessionService } from '../../../../src/app/modules/session/session.service.js';
import { JwtUtil } from '../../../../src/app/shared/utils/jwt.js';

vi.mock('../../../../src/app/modules/auth/auth.repository.js', () => ({
  AuthRepository: {
    findUserById: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/session/session.service.js', () => ({
  SessionService: {
    findActiveSession: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllSessions: vi.fn(),
    rotateRefreshToken: vi.fn(),
  },
}));

vi.mock('../../../../src/app/shared/utils/jwt.js', () => ({
  JwtUtil: {
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  },
}));

describe('TokenService.refreshTokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject when the refresh token is invalid', async () => {
    const refreshToken = 'invalid-refresh-token';

    vi.mocked(JwtUtil.verifyRefreshToken).mockImplementation(() => {
      throw new Error('Invalid refresh token');
    });

    await expect(TokenService.refreshTokens(refreshToken)).rejects.toThrow('Invalid refresh token');

    expect(JwtUtil.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(SessionService.findActiveSession).not.toHaveBeenCalled();
    expect(AuthRepository.findUserById).not.toHaveBeenCalled();
  });

  it('should reject when no active session exists for the refresh token', async () => {
    const refreshToken = 'refresh-token';

    const userId = new mongoose.Types.ObjectId();

    vi.mocked(JwtUtil.verifyRefreshToken).mockReturnValue({
      userId: userId.toString(),
      email: 'farmer@example.com',
      role: 'farmer',
    });

    vi.mocked(SessionService.findActiveSession).mockResolvedValue(null);

    await expect(TokenService.refreshTokens(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid or expired refresh token.',
    });

    expect(JwtUtil.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(SessionService.findActiveSession).toHaveBeenCalledWith(refreshToken);

    expect(AuthRepository.findUserById).not.toHaveBeenCalled();
    expect(SessionService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('should reject when the token user does not match the session user', async () => {
    const refreshToken = 'refresh-token';

    const tokenUserId = new mongoose.Types.ObjectId();
    const sessionUserId = new mongoose.Types.ObjectId();

    vi.mocked(JwtUtil.verifyRefreshToken).mockReturnValue({
      userId: tokenUserId.toString(),
      email: 'farmer@example.com',
      role: 'farmer',
    });

    vi.mocked(SessionService.findActiveSession).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId: sessionUserId,
      refreshTokenHash: 'hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    await expect(TokenService.refreshTokens(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid refresh token.',
    });

    expect(AuthRepository.findUserById).not.toHaveBeenCalled();
    expect(SessionService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('should reject when the user no longer exists', async () => {
    const refreshToken = 'refresh-token';
    const userId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId();

    vi.mocked(JwtUtil.verifyRefreshToken).mockReturnValue({
      userId: userId.toString(),
      email: 'farmer@example.com',
      role: 'farmer',
    });

    vi.mocked(SessionService.findActiveSession).mockResolvedValue({
      _id: sessionId,
      userId,
      refreshTokenHash: 'hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.mocked(AuthRepository.findUserById).mockResolvedValue(null);

    await expect(TokenService.refreshTokens(refreshToken)).rejects.toMatchObject({
      statusCode: 401,
      message: 'User not found.',
    });

    expect(AuthRepository.findUserById).toHaveBeenCalledWith(userId);
    expect(SessionService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('should reject when the user email is not verified', async () => {
    const refreshToken = 'refresh-token';
    const userId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId();

    const user = {
      _id: userId,
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: 'hashed-password',
      role: 'farmer' as const,
      isEmailVerified: false,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(JwtUtil.verifyRefreshToken).mockReturnValue({
      userId: userId.toString(),
      email: user.email,
      role: user.role,
    });

    vi.mocked(SessionService.findActiveSession).mockResolvedValue({
      _id: sessionId,
      userId,
      refreshTokenHash: 'hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.mocked(AuthRepository.findUserById).mockResolvedValue(user as never);

    await expect(TokenService.refreshTokens(refreshToken)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Email is not verified.',
    });

    expect(SessionService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('should reject when the user account is inactive', async () => {
    const refreshToken = 'refresh-token';
    const userId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId();

    const user = {
      _id: userId,
      name: 'Inactive Farmer',
      email: 'inactive@example.com',
      password: 'hashed-password',
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'inactive' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(JwtUtil.verifyRefreshToken).mockReturnValue({
      userId: userId.toString(),
      email: user.email,
      role: user.role,
    });

    vi.mocked(SessionService.findActiveSession).mockResolvedValue({
      _id: sessionId,
      userId,
      refreshTokenHash: 'hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.mocked(AuthRepository.findUserById).mockResolvedValue(user as never);

    await expect(TokenService.refreshTokens(refreshToken)).rejects.toMatchObject({
      statusCode: 403,
      message: 'Your account has been suspended or is inactive.',
    });

    expect(SessionService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('should successfully refresh tokens and rotate the refresh session', async () => {
    const refreshToken = 'old-refresh-token';
    const newAccessToken = 'new-access-token';
    const newRefreshToken = 'new-refresh-token';

    const userId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId();

    const user = {
      _id: userId,
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: 'hashed-password',
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const session = {
      _id: sessionId,
      userId,
      refreshTokenHash: 'old-hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(JwtUtil.verifyRefreshToken).mockReturnValue({
      userId: userId.toString(),
      email: user.email,
      role: user.role,
    });

    vi.mocked(SessionService.findActiveSession).mockResolvedValue(session as never);

    vi.mocked(AuthRepository.findUserById).mockResolvedValue(user as never);

    vi.mocked(JwtUtil.signAccessToken).mockReturnValue(newAccessToken);

    vi.mocked(JwtUtil.signRefreshToken).mockReturnValue(newRefreshToken);

    vi.mocked(SessionService.rotateRefreshToken).mockResolvedValue({
      ...session,
      refreshTokenHash: 'new-hashed-refresh-token',
    });

    const result = await TokenService.refreshTokens(refreshToken);

    const expectedPayload = {
      userId: userId.toString(),
      email: user.email,
      role: user.role,
    };

    expect(JwtUtil.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);

    expect(SessionService.findActiveSession).toHaveBeenCalledWith(refreshToken);

    expect(AuthRepository.findUserById).toHaveBeenCalledWith(userId);

    expect(JwtUtil.signAccessToken).toHaveBeenCalledWith(expectedPayload);

    expect(JwtUtil.signRefreshToken).toHaveBeenCalledWith(expectedPayload);

    expect(SessionService.rotateRefreshToken).toHaveBeenCalledWith(
      sessionId,
      newRefreshToken,
      expect.any(Date)
    );

    expect(result).toEqual({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
});

describe('TokenService.logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should revoke the active session for a valid refresh token', async () => {
    const refreshToken = 'valid-refresh-token';

    const userId = new mongoose.Types.ObjectId();
    const sessionId = new mongoose.Types.ObjectId();

    vi.mocked(JwtUtil.verifyRefreshToken).mockReturnValue({
      userId: userId.toString(),
      email: 'farmer@example.com',
      role: 'farmer',
    });

    vi.mocked(SessionService.findActiveSession).mockResolvedValue({
      _id: sessionId,
      userId,
      refreshTokenHash: 'hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.mocked(SessionService.revokeSession).mockResolvedValue({
      _id: sessionId,
    } as never);

    await expect(TokenService.logout(refreshToken)).resolves.toBeUndefined();

    expect(JwtUtil.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);

    expect(SessionService.findActiveSession).toHaveBeenCalledWith(refreshToken);

    expect(SessionService.revokeSession).toHaveBeenCalledWith(sessionId);
  });

  it('should silently ignore an invalid refresh token during logout', async () => {
    const refreshToken = 'invalid-refresh-token';

    vi.mocked(JwtUtil.verifyRefreshToken).mockImplementation(() => {
      throw new Error('Invalid refresh token');
    });

    await expect(TokenService.logout(refreshToken)).resolves.toBeUndefined();

    expect(SessionService.findActiveSession).not.toHaveBeenCalled();

    expect(SessionService.revokeSession).not.toHaveBeenCalled();
  });

  it('should silently ignore a refresh token with no active session during logout', async () => {
    const refreshToken = 'expired-refresh-token';

    const userId = new mongoose.Types.ObjectId();

    vi.mocked(JwtUtil.verifyRefreshToken).mockReturnValue({
      userId: userId.toString(),
      email: 'farmer@example.com',
      role: 'farmer',
    });

    vi.mocked(SessionService.findActiveSession).mockResolvedValue(null);

    await expect(TokenService.logout(refreshToken)).resolves.toBeUndefined();

    expect(SessionService.findActiveSession).toHaveBeenCalledWith(refreshToken);

    expect(SessionService.revokeSession).not.toHaveBeenCalled();
  });
});

describe('TokenService.logoutAllSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should revoke all sessions belonging to the user', async () => {
    const userId = new mongoose.Types.ObjectId();

    vi.mocked(SessionService.revokeAllSessions).mockResolvedValue(undefined);

    await expect(TokenService.logoutAllSessions(userId)).resolves.toBeUndefined();

    expect(SessionService.revokeAllSessions).toHaveBeenCalledWith(userId);
  });
});
