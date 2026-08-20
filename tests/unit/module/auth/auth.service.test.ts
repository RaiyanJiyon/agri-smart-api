import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../../src/app/modules/auth/auth.service.js';
import { AuthRepository } from '../../../../src/app/modules/auth/auth.repository.js';
import { SessionService } from '../../../../src/app/modules/session/session.service.js';
import { JwtUtil } from '../../../../src/app/shared/utils/jwt.js';
import mongoose from 'mongoose';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';

vi.mock('../../../../src/app/modules/auth/auth.repository.js', () => ({
  AuthRepository: {
    findUserByEmail: vi.fn(),
    findUserByEmailWithPassword: vi.fn(),
    findUserById: vi.fn(),
    findUserByIdWithPassword: vi.fn(),
    createUser: vi.fn(),
    updateLastLogin: vi.fn(),
    updateVerificationStatus: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/session/session.service.js', () => ({
  SessionService: {
    createSession: vi.fn(),
    findActiveSession: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllSessions: vi.fn(),
    revokeAllExcept: vi.fn(),
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

describe('AuthService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject login when the user does not exist', async () => {
    vi.mocked(AuthRepository.findUserByEmailWithPassword).mockResolvedValue(null);

    await expect(
      AuthService.login({
        email: 'unknown@example.com',
        password: 'Password123!',
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password.',
    });

    expect(AuthRepository.findUserByEmailWithPassword).toHaveBeenCalledWith('unknown@example.com');

    expect(SessionService.createSession).not.toHaveBeenCalled();
    expect(JwtUtil.signAccessToken).not.toHaveBeenCalled();
    expect(JwtUtil.signRefreshToken).not.toHaveBeenCalled();
  });

  it('should reject login when the user password is missing', async () => {
    const user = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: '',
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(AuthRepository.findUserByEmailWithPassword).mockResolvedValue(user as never);

    await expect(
      AuthService.login({
        email: user.email,
        password: 'Password123!',
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'User password is missing.',
    });

    expect(AuthRepository.findUserByEmailWithPassword).toHaveBeenCalledWith(user.email);

    expect(SessionService.createSession).not.toHaveBeenCalled();
    expect(JwtUtil.signAccessToken).not.toHaveBeenCalled();
    expect(JwtUtil.signRefreshToken).not.toHaveBeenCalled();
  });

  it('should reject login when the password is incorrect', async () => {
    const password = 'CorrectPassword123!';
    const wrongPassword = 'WrongPassword123!';

    const user = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: await hashPassword(password),
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(AuthRepository.findUserByEmailWithPassword).mockResolvedValue(user as never);

    await expect(
      AuthService.login({
        email: user.email,
        password: wrongPassword,
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password.',
    });

    expect(AuthRepository.findUserByEmailWithPassword).toHaveBeenCalledWith(user.email);

    expect(SessionService.createSession).not.toHaveBeenCalled();
    expect(JwtUtil.signAccessToken).not.toHaveBeenCalled();
    expect(JwtUtil.signRefreshToken).not.toHaveBeenCalled();
  });

  it('should reject login when the email is not verified', async () => {
    const password = 'CorrectPassword123!';

    const user = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Farmer',
      email: 'unverified@example.com',
      password: await hashPassword(password),
      role: 'farmer' as const,
      isEmailVerified: false,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(AuthRepository.findUserByEmailWithPassword).mockResolvedValue(user as never);

    await expect(
      AuthService.login({
        email: user.email,
        password,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Please verify your email first.',
    });

    expect(AuthRepository.findUserByEmailWithPassword).toHaveBeenCalledWith(user.email);

    expect(SessionService.createSession).not.toHaveBeenCalled();
    expect(JwtUtil.signAccessToken).not.toHaveBeenCalled();
    expect(JwtUtil.signRefreshToken).not.toHaveBeenCalled();
  });

  it('should reject login when the account is inactive', async () => {
    const password = 'CorrectPassword123!';

    const user = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Inactive Farmer',
      email: 'inactive@example.com',
      password: await hashPassword(password),
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'inactive' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(AuthRepository.findUserByEmailWithPassword).mockResolvedValue(user as never);

    await expect(
      AuthService.login({
        email: user.email,
        password,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Your account has been suspended or is inactive.',
    });

    expect(SessionService.createSession).not.toHaveBeenCalled();
    expect(JwtUtil.signAccessToken).not.toHaveBeenCalled();
    expect(JwtUtil.signRefreshToken).not.toHaveBeenCalled();
  });
});
