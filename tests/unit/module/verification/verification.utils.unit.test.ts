import mongoose, { type HydratedDocument } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  consumeVerification,
  createVerificationAndSendEmail,
  getActiveVerification,
} from '../../../../src/app/modules/verification/verification.utils.js';
import { AuthRepository } from '../../../../src/app/modules/auth/auth.repository.js';
import { VerificationRepository } from '../../../../src/app/modules/verification/verification.repository.js';
import { EmailService } from '../../../../src/app/shared/email/index.js';
import { VERIFICATION_TYPE } from '../../../../src/app/modules/verification/verification.constant.js';
import type { User } from '../../../../src/app/modules/auth/auth.interface.js';

vi.mock('../../../../src/app/modules/auth/auth.repository.js', () => ({
  AuthRepository: {
    findUserByEmail: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/verification/verification.repository.js', () => ({
  VerificationRepository: {
    createOrReplace: vi.fn(),
    findActiveVerificationByHash: vi.fn(),
    markAsUsed: vi.fn(),
  },
}));

vi.mock('../../../../src/app/shared/email/index.js', () => ({
  EmailService: {
    send: vi.fn(),
  },
}));

describe('verification.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVerificationAndSendEmail', () => {
    it('should return early when user email is not found', async () => {
      vi.mocked(AuthRepository.findUserByEmail).mockResolvedValueOnce(null);

      await createVerificationAndSendEmail({
        email: 'nonexistent@example.com',
        type: VERIFICATION_TYPE.EMAIL_VERIFICATION,
        expiresIn: '24h',
        subject: 'Verify email',
        buildUrl: (t) => `http://example.com/verify?token=${t}`,
        buildTemplate: (url) => `<a href="${url}">Verify</a>`,
      });

      expect(VerificationRepository.createOrReplace).not.toHaveBeenCalled();
      expect(EmailService.send).not.toHaveBeenCalled();
    });

    it('should return early when email is already verified and requireUnverifiedEmail is true', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'verified@example.com',
        name: 'Verified User',
        isEmailVerified: true,
      } as unknown as User;

      vi.mocked(AuthRepository.findUserByEmail).mockResolvedValueOnce(
        mockUser as HydratedDocument<User>
      );

      await createVerificationAndSendEmail({
        email: 'verified@example.com',
        type: VERIFICATION_TYPE.EMAIL_VERIFICATION,
        expiresIn: '24h',
        subject: 'Verify email',
        buildUrl: (t) => `http://example.com/verify?token=${t}`,
        buildTemplate: (url) => `<a href="${url}">Verify</a>`,
        requireUnverifiedEmail: true,
      });

      expect(VerificationRepository.createOrReplace).not.toHaveBeenCalled();
      expect(EmailService.send).not.toHaveBeenCalled();
    });
  });

  describe('getActiveVerification', () => {
    it('should throw ApiError 400 when token verification record is missing', async () => {
      vi.mocked(VerificationRepository.findActiveVerificationByHash).mockResolvedValueOnce(null);

      await expect(
        getActiveVerification('invalid-token', VERIFICATION_TYPE.EMAIL_VERIFICATION)
      ).rejects.toThrow('Invalid or expired verification token.');
    });
  });

  describe('consumeVerification', () => {
    it('should call VerificationRepository.markAsUsed', async () => {
      const id = new mongoose.Types.ObjectId();
      await consumeVerification(id);
      expect(VerificationRepository.markAsUsed).toHaveBeenCalledWith(id);
    });
  });
});
