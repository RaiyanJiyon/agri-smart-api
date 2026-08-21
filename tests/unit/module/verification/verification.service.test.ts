import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

import { VerificationService } from '../../../../src/app/modules/verification/verification.service.js';
import { VerificationRepository } from '../../../../src/app/modules/verification/verification.repository.js';
import { AuthRepository } from '../../../../src/app/modules/auth/auth.repository.js';
import { SessionService } from '../../../../src/app/modules/session/session.service.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';

vi.mock('../../../../src/app/modules/verification/verification.repository.js', () => ({
  VerificationRepository: {
    createOrReplace: vi.fn(),
    findActiveVerificationByHash: vi.fn(),
    consumeToken: vi.fn(),
    markAsUsed: vi.fn(),
    deleteByUserAndType: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/auth/auth.repository.js', () => ({
  AuthRepository: {
    findUserById: vi.fn(),
    findUserByIdWithPassword: vi.fn(),
    updateVerificationStatus: vi.fn(),
    updatePassword: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/session/session.service.js', () => ({
  SessionService: {
    revokeAllSessions: vi.fn(),
  },
}));

describe('VerificationService.verifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject verification when the token is invalid or expired', async () => {
    vi.mocked(VerificationRepository.findActiveVerificationByHash).mockResolvedValue(null);

    await expect(VerificationService.verifyEmail('invalid-token')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid or expired verification token.',
    });

    expect(VerificationRepository.findActiveVerificationByHash).toHaveBeenCalled();

    expect(AuthRepository.findUserById).not.toHaveBeenCalled();
    expect(AuthRepository.updateVerificationStatus).not.toHaveBeenCalled();
    expect(VerificationRepository.markAsUsed).not.toHaveBeenCalled();
  });

  it('should reject verification when the user does not exist', async () => {
    const userId = new mongoose.Types.ObjectId();

    vi.mocked(VerificationRepository.findActiveVerificationByHash).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId,
      type: 'email_verification',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    } as never);

    vi.mocked(AuthRepository.findUserById).mockResolvedValue(null);

    await expect(VerificationService.verifyEmail('valid-token')).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found.',
    });

    expect(AuthRepository.findUserById).toHaveBeenCalledWith(userId);

    expect(AuthRepository.updateVerificationStatus).not.toHaveBeenCalled();
    expect(VerificationRepository.markAsUsed).not.toHaveBeenCalled();
  });

  it('should reject verification when the email is already verified', async () => {
    const userId = new mongoose.Types.ObjectId();
    const verificationId = new mongoose.Types.ObjectId();

    const verification = {
      _id: verificationId,
      userId,
      type: 'email_verification',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    };

    const user = {
      _id: userId,
      name: 'Test Farmer',
      email: 'farmer@example.com',
      isEmailVerified: true,
      role: 'farmer' as const,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(VerificationRepository.findActiveVerificationByHash).mockResolvedValue(
      verification as never
    );

    vi.mocked(AuthRepository.findUserById).mockResolvedValue(user as never);

    await expect(VerificationService.verifyEmail('valid-token')).rejects.toMatchObject({
      statusCode: 400,
      message: 'Email already verified.',
    });

    expect(AuthRepository.findUserById).toHaveBeenCalledWith(userId);

    expect(AuthRepository.updateVerificationStatus).not.toHaveBeenCalled();
    expect(VerificationRepository.markAsUsed).not.toHaveBeenCalled();
  });

  it('should successfully verify the user email', async () => {
    const userId = new mongoose.Types.ObjectId();
    const verificationId = new mongoose.Types.ObjectId();

    const verification = {
      _id: verificationId,
      userId,
      type: 'email_verification',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    };

    const user = {
      _id: userId,
      name: 'Test Farmer',
      email: 'farmer@example.com',
      isEmailVerified: false,
      role: 'farmer' as const,
      status: 'active' as const,
      passwordChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(VerificationRepository.findActiveVerificationByHash).mockResolvedValue(
      verification as never
    );

    vi.mocked(AuthRepository.findUserById).mockResolvedValue(user as never);

    vi.mocked(AuthRepository.updateVerificationStatus).mockResolvedValue({
      ...user,
      isEmailVerified: true,
    } as never);

    vi.mocked(VerificationRepository.markAsUsed).mockResolvedValue({
      ...verification,
      usedAt: new Date(),
    } as never);

    await expect(VerificationService.verifyEmail('valid-token')).resolves.toBeUndefined();

    expect(VerificationRepository.findActiveVerificationByHash).toHaveBeenCalled();

    expect(AuthRepository.findUserById).toHaveBeenCalledWith(userId);

    expect(AuthRepository.updateVerificationStatus).toHaveBeenCalledWith(userId, true);

    expect(VerificationRepository.markAsUsed).toHaveBeenCalledWith(verificationId);
  });
});

describe('VerificationService.resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject password reset when the token is invalid or expired', async () => {
    vi.mocked(VerificationRepository.consumeToken).mockResolvedValue(null);

    await expect(
      VerificationService.resetPassword('invalid-token', 'NewPassword123!')
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid or expired password reset token.',
    });

    expect(VerificationRepository.consumeToken).toHaveBeenCalled();

    expect(AuthRepository.findUserByIdWithPassword).not.toHaveBeenCalled();
    expect(AuthRepository.updatePassword).not.toHaveBeenCalled();
    expect(SessionService.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('should reject password reset when the user does not exist', async () => {
    const userId = new mongoose.Types.ObjectId();

    vi.mocked(VerificationRepository.consumeToken).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId,
      type: 'password_reset',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    } as never);

    vi.mocked(AuthRepository.findUserByIdWithPassword).mockResolvedValue(null);

    await expect(
      VerificationService.resetPassword('valid-token', 'NewPassword123!')
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found.',
    });

    expect(AuthRepository.findUserByIdWithPassword).toHaveBeenCalledWith(userId);

    expect(AuthRepository.updatePassword).not.toHaveBeenCalled();
    expect(SessionService.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('should reject password reset when the new password is the same as the current password', async () => {
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

    vi.mocked(VerificationRepository.consumeToken).mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      userId,
      type: 'password_reset',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    } as never);

    vi.mocked(AuthRepository.findUserByIdWithPassword).mockResolvedValue(user as never);

    await expect(
      VerificationService.resetPassword('valid-token', currentPassword)
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'New password must be different from the current password.',
    });

    expect(AuthRepository.updatePassword).not.toHaveBeenCalled();
    expect(SessionService.revokeAllSessions).not.toHaveBeenCalled();
  });

  it('should successfully reset the password and revoke all sessions', async () => {
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

    const verificationId = new mongoose.Types.ObjectId();

    vi.mocked(VerificationRepository.consumeToken).mockResolvedValue({
      _id: verificationId,
      userId,
      type: 'password_reset',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    } as never);

    vi.mocked(AuthRepository.findUserByIdWithPassword).mockResolvedValue(user as never);

    vi.mocked(AuthRepository.updatePassword).mockResolvedValue({
      ...user,
      password: 'new-hashed-password',
    });

    vi.mocked(SessionService.revokeAllSessions).mockResolvedValue(undefined);

    await expect(
      VerificationService.resetPassword('valid-token', newPassword)
    ).resolves.toBeUndefined();

    expect(VerificationRepository.consumeToken).toHaveBeenCalled();

    expect(AuthRepository.findUserByIdWithPassword).toHaveBeenCalledWith(userId);

    expect(AuthRepository.updatePassword).toHaveBeenCalledWith(userId, expect.any(String));

    expect(SessionService.revokeAllSessions).toHaveBeenCalledWith(userId);
  });
});
