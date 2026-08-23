import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../../src/app/modules/auth/auth.service.js';
import { AuthRepository } from '../../../../src/app/modules/auth/auth.repository.js';
import { ProfileRepository } from '../../../../src/app/modules/profile/profile.repository.js';
import { VerificationService } from '../../../../src/app/modules/verification/verification.service.js';
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

vi.mock('../../../../src/app/modules/profile/profile.repository.js', () => ({
  ProfileRepository: {
    create: vi.fn(),
    findByUserId: vi.fn(),
    updateByUserId: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/verification/verification.service.js', () => ({
  VerificationService: {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    verifyEmail: vi.fn(),
    resetPassword: vi.fn(),
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

/**
 * Helper: creates a mock Mongoose ClientSession that executes the
 * withTransaction callback immediately and returns its result.
 * This keeps register() tests pure unit tests with no real DB I/O.
 */
const makeMockSession = () => {
  const mockSession = {
    withTransaction: vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => fn()),
    endSession: vi.fn().mockResolvedValue(undefined),
  };
  return mockSession;
};

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

  it('should reject login when the account is blocked', async () => {
    const password = 'CorrectPassword123!';

    const user = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Blocked Farmer',
      email: 'blocked@example.com',
      password: await hashPassword(password),
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'blocked' as const,
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

  it('should successfully login an active verified user', async () => {
    const password = 'CorrectPassword123!';

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

    const accessToken = 'mock-access-token';
    const refreshToken = 'mock-refresh-token';

    vi.mocked(AuthRepository.findUserByEmailWithPassword).mockResolvedValue(user as never);

    vi.mocked(JwtUtil.signAccessToken).mockReturnValue(accessToken);
    vi.mocked(JwtUtil.signRefreshToken).mockReturnValue(refreshToken);

    vi.mocked(SessionService.createSession).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId: user._id,
      refreshTokenHash: 'hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.mocked(AuthRepository.updateLastLogin).mockResolvedValue(user as never);

    const result = await AuthService.login({
      email: user.email,
      password,
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
    });

    const expectedPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    expect(AuthRepository.findUserByEmailWithPassword).toHaveBeenCalledWith(user.email);

    expect(JwtUtil.signAccessToken).toHaveBeenCalledWith(expectedPayload);

    expect(JwtUtil.signRefreshToken).toHaveBeenCalledWith(expectedPayload);

    expect(SessionService.createSession).toHaveBeenCalledWith({
      userId: user._id,
      refreshToken,
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresAt: expect.any(Date),
    });

    expect(AuthRepository.updateLastLogin).toHaveBeenCalledWith(user._id);

    expect(result).toEqual({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  });
});

describe('AuthService.changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject password change when the user does not exist', async () => {
    const userId = new mongoose.Types.ObjectId();

    vi.mocked(AuthRepository.findUserByIdWithPassword).mockResolvedValue(null);

    await expect(
      AuthService.changePassword({
        userId,
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword123!',
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found.',
    });

    expect(AuthRepository.findUserByIdWithPassword).toHaveBeenCalledWith(userId);

    expect(AuthRepository.updatePassword).not.toHaveBeenCalled();
    expect(SessionService.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('should reject password change when the user password is missing', async () => {
    const userId = new mongoose.Types.ObjectId();

    const user = {
      _id: userId,
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

    vi.mocked(AuthRepository.findUserByIdWithPassword).mockResolvedValue(user as never);

    await expect(
      AuthService.changePassword({
        userId,
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword123!',
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'User credential state is invalid.',
    });

    expect(AuthRepository.updatePassword).not.toHaveBeenCalled();
    expect(SessionService.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('should reject password change when the current password is incorrect', async () => {
    const userId = new mongoose.Types.ObjectId();

    const currentPassword = 'CorrectPassword123!';
    const wrongPassword = 'WrongPassword123!';

    const user = {
      _id: userId,
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: await hashPassword(currentPassword),
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(AuthRepository.findUserByIdWithPassword).mockResolvedValue(user as never);

    await expect(
      AuthService.changePassword({
        userId,
        currentPassword: wrongPassword,
        newPassword: 'NewPassword123!',
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Current password is incorrect.',
    });

    expect(AuthRepository.updatePassword).not.toHaveBeenCalled();
    expect(SessionService.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('should reject password change when the new password is the same as the current password', async () => {
    const userId = new mongoose.Types.ObjectId();

    const currentPassword = 'CurrentPassword123!';

    const user = {
      _id: userId,
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: await hashPassword(currentPassword),
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(AuthRepository.findUserByIdWithPassword).mockResolvedValue(user as never);

    await expect(
      AuthService.changePassword({
        userId,
        currentPassword,
        newPassword: currentPassword,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'New password must be different from the current password.',
    });

    expect(AuthRepository.updatePassword).not.toHaveBeenCalled();
    expect(SessionService.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('should reject password change when updating the password fails', async () => {
    const userId = new mongoose.Types.ObjectId();

    const currentPassword = 'CurrentPassword123!';
    const newPassword = 'NewPassword123!';

    const user = {
      _id: userId,
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: await hashPassword(currentPassword),
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(AuthRepository.findUserByIdWithPassword).mockResolvedValue(user as never);

    vi.mocked(AuthRepository.updatePassword).mockResolvedValue(null);

    await expect(
      AuthService.changePassword({
        userId,
        currentPassword,
        newPassword,
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to update password.',
    });

    expect(AuthRepository.updatePassword).toHaveBeenCalledWith(userId, expect.any(String));

    expect(SessionService.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('should successfully change the password and revoke all sessions', async () => {
    const userId = new mongoose.Types.ObjectId();

    const currentPassword = 'CurrentPassword123!';
    const newPassword = 'NewPassword123!';

    const user = {
      _id: userId,
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: await hashPassword(currentPassword),
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedUser = {
      ...user,
      password: 'new-hashed-password',
      passwordChangedAt: new Date(),
    };

    vi.mocked(AuthRepository.findUserByIdWithPassword).mockResolvedValue(user as never);

    vi.mocked(AuthRepository.updatePassword).mockResolvedValue(updatedUser);

    vi.mocked(SessionService.revokeAllSessions).mockResolvedValue(undefined);

    await expect(
      AuthService.changePassword({
        userId,
        currentPassword,
        newPassword,
      })
    ).resolves.toBeUndefined();

    expect(AuthRepository.findUserByIdWithPassword).toHaveBeenCalledWith(userId);

    expect(AuthRepository.updatePassword).toHaveBeenCalledWith(userId, expect.any(String));

    expect(SessionService.revokeAllSessions).toHaveBeenCalledWith(userId);
  });
});

describe('AuthService.register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject registration when the email is already taken', async () => {
    const existingUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Existing Farmer',
      email: 'taken@example.com',
      role: 'farmer' as const,
      isEmailVerified: true,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(AuthRepository.findUserByEmail).mockResolvedValue(existingUser as never);

    await expect(
      AuthService.register({
        name: 'New Farmer',
        email: 'taken@example.com',
        password: 'Password123!',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'User already exists.',
    });

    expect(AuthRepository.findUserByEmail).toHaveBeenCalledWith('taken@example.com');

    expect(AuthRepository.createUser).not.toHaveBeenCalled();
    expect(ProfileRepository.create).not.toHaveBeenCalled();
    expect(VerificationService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('should hash the password and never persist the plaintext password', async () => {
    const plainPassword = 'PlainPassword123!';

    vi.mocked(AuthRepository.findUserByEmail).mockResolvedValue(null);

    const createdUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'New Farmer',
      email: 'new@example.com',
      password: 'argon2-hashed-password',
      role: 'farmer' as const,
      isEmailVerified: false,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSession = makeMockSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as never);

    vi.mocked(AuthRepository.createUser).mockResolvedValue(createdUser as never);
    vi.mocked(ProfileRepository.create).mockResolvedValue({ userId: createdUser._id });
    vi.mocked(VerificationService.sendVerificationEmail).mockResolvedValue(undefined);

    await AuthService.register({
      name: 'New Farmer',
      email: 'new@example.com',
      password: plainPassword,
    });

    // createUser must have been called with a hashed password, not the plaintext
    const createUserCall = vi.mocked(AuthRepository.createUser).mock.calls[0];
    expect(createUserCall).toBeDefined();

    const persistedPassword = createUserCall![0].password;
    expect(persistedPassword).not.toBe(plainPassword);
    // Argon2 hashes always begin with the $argon2 identifier
    expect(persistedPassword).toMatch(/^\$argon2/);
  });

  it('should create the user and the profile document inside the same transaction', async () => {
    vi.mocked(AuthRepository.findUserByEmail).mockResolvedValue(null);

    const userId = new mongoose.Types.ObjectId();

    const createdUser = {
      _id: userId,
      name: 'Transactional Farmer',
      email: 'tx@example.com',
      password: 'hashed-password',
      role: 'farmer' as const,
      isEmailVerified: false,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSession = makeMockSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as never);

    vi.mocked(AuthRepository.createUser).mockResolvedValue(createdUser as never);
    vi.mocked(ProfileRepository.create).mockResolvedValue({ userId });
    vi.mocked(VerificationService.sendVerificationEmail).mockResolvedValue(undefined);

    await AuthService.register({
      name: 'Transactional Farmer',
      email: 'tx@example.com',
      password: 'Password123!',
    });

    // Both createUser and ProfileRepository.create must be called once
    expect(AuthRepository.createUser).toHaveBeenCalledTimes(1);
    expect(ProfileRepository.create).toHaveBeenCalledTimes(1);

    // Profile must reference the newly created user's id
    expect(ProfileRepository.create).toHaveBeenCalledWith(
      { userId },
      expect.anything() // the session argument
    );

    // withTransaction must have been invoked on the session
    expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);
  });

  it('should always end the mongoose session after a successful registration', async () => {
    vi.mocked(AuthRepository.findUserByEmail).mockResolvedValue(null);

    const createdUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Cleanup Farmer',
      email: 'cleanup@example.com',
      password: 'hashed-password',
      role: 'farmer' as const,
      isEmailVerified: false,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSession = makeMockSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as never);

    vi.mocked(AuthRepository.createUser).mockResolvedValue(createdUser as never);
    vi.mocked(ProfileRepository.create).mockResolvedValue({ userId: createdUser._id });
    vi.mocked(VerificationService.sendVerificationEmail).mockResolvedValue(undefined);

    await AuthService.register({
      name: 'Cleanup Farmer',
      email: 'cleanup@example.com',
      password: 'Password123!',
    });

    expect(mockSession.endSession).toHaveBeenCalledTimes(1);
  });

  it('should always end the mongoose session even when createUser throws', async () => {
    vi.mocked(AuthRepository.findUserByEmail).mockResolvedValue(null);

    const mockSession = makeMockSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as never);

    const dbError = new Error('Database write failure');
    vi.mocked(AuthRepository.createUser).mockRejectedValue(dbError);

    await expect(
      AuthService.register({
        name: 'Error Farmer',
        email: 'error@example.com',
        password: 'Password123!',
      })
    ).rejects.toThrow('Database write failure');

    // The session must be ended in the finally block even on error
    expect(mockSession.endSession).toHaveBeenCalledTimes(1);

    // Verification email must NOT be sent when the transaction fails
    expect(VerificationService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('should reject with HTTP 500 when withTransaction resolves to a falsy value', async () => {
    vi.mocked(AuthRepository.findUserByEmail).mockResolvedValue(null);

    const mockSession = {
      withTransaction: vi.fn().mockResolvedValue(undefined), // simulates falsy return
      endSession: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as never);

    await expect(
      AuthService.register({
        name: 'Null Return Farmer',
        email: 'nullreturn@example.com',
        password: 'Password123!',
      })
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'Failed to create user.',
    });

    // Verification email must NOT be sent
    expect(VerificationService.sendVerificationEmail).not.toHaveBeenCalled();

    // Session must still be cleaned up
    expect(mockSession.endSession).toHaveBeenCalledTimes(1);
  });

  it('should send a verification email after successfully creating the user', async () => {
    vi.mocked(AuthRepository.findUserByEmail).mockResolvedValue(null);

    const createdUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Email Farmer',
      email: 'sendme@example.com',
      password: 'hashed-password',
      role: 'farmer' as const,
      isEmailVerified: false,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSession = makeMockSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as never);

    vi.mocked(AuthRepository.createUser).mockResolvedValue(createdUser as never);
    vi.mocked(ProfileRepository.create).mockResolvedValue({ userId: createdUser._id });
    vi.mocked(VerificationService.sendVerificationEmail).mockResolvedValue(undefined);

    await AuthService.register({
      name: 'Email Farmer',
      email: 'sendme@example.com',
      password: 'Password123!',
    });

    expect(VerificationService.sendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(VerificationService.sendVerificationEmail).toHaveBeenCalledWith('sendme@example.com');
  });

  it('should return the created user document on a successful registration', async () => {
    vi.mocked(AuthRepository.findUserByEmail).mockResolvedValue(null);

    const userId = new mongoose.Types.ObjectId();

    const createdUser = {
      _id: userId,
      name: 'Return Farmer',
      email: 'return@example.com',
      password: 'hashed-password',
      role: 'farmer' as const,
      isEmailVerified: false,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSession = makeMockSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as never);

    vi.mocked(AuthRepository.createUser).mockResolvedValue(createdUser as never);
    vi.mocked(ProfileRepository.create).mockResolvedValue({ userId });
    vi.mocked(VerificationService.sendVerificationEmail).mockResolvedValue(undefined);

    const result = await AuthService.register({
      name: 'Return Farmer',
      email: 'return@example.com',
      password: 'Password123!',
    });

    expect(result).toMatchObject({
      _id: userId,
      name: 'Return Farmer',
      email: 'return@example.com',
      isEmailVerified: false,
    });
  });
});
