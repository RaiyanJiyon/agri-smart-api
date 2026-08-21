import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

import { VerificationService } from '../../../../src/app/modules/verification/verification.service.js';
import { VerificationRepository } from '../../../../src/app/modules/verification/verification.repository.js';
import { AuthRepository } from '../../../../src/app/modules/auth/auth.repository.js';

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
