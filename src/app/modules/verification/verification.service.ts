import { AuthRepository } from '../auth/index.js';
import { VerificationRepository } from './verification.repository.js';
import { VERIFICATION_TYPE } from './verification.constant.js';
import {
  EMAIL_SUBJECT,
  verificationEmailTemplate,
  forgotPasswordEmailTemplate,
} from '../../shared/email/index.js';
import { createVerificationAndSendEmail } from './verification.utils.js';
import { SessionService } from '../session/index.js';
import { config } from '../../shared/config/index.js';
import { hashToken, comparePassword, hashPassword } from '../../shared/utils/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { ApiError } from '../../shared/errors/index.js';

const sendVerificationEmail = async (email: string): Promise<void> => {
  await createVerificationAndSendEmail({
    email,
    type: VERIFICATION_TYPE.EMAIL_VERIFICATION,
    expiresIn: config.MAIL.EMAIL_VERIFICATION_EXPIRES_IN,
    subject: EMAIL_SUBJECT.EMAIL_VERIFICATION,
    buildUrl: (token) => `${config.CLIENT_URL[0]}/verify-email?token=${token}`,
    buildTemplate: verificationEmailTemplate,
    requireUnverifiedEmail: true,
  });
};

const verifyEmail = async (token: string): Promise<void> => {
  const tokenHash = hashToken(token);

  const verification = await VerificationRepository.findActiveVerificationByHash(
    tokenHash,
    VERIFICATION_TYPE.EMAIL_VERIFICATION
  );

  if (!verification) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired verification token.');
  }

  const user = await AuthRepository.findUserById(verification.userId);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  if (user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email already verified.');
  }

  await AuthRepository.updateVerificationStatus(user._id, true);

  await VerificationRepository.markAsUsed(verification._id);
};

const sendPasswordResetEmail = async (email: string): Promise<void> => {
  await createVerificationAndSendEmail({
    email,
    type: VERIFICATION_TYPE.PASSWORD_RESET,
    expiresIn: config.MAIL.PASSWORD_RESET_EXPIRES_IN,
    subject: EMAIL_SUBJECT.PASSWORD_RESET,
    buildUrl: (token) => `${config.CLIENT_URL[0]}/reset-password?token=${token}`,
    buildTemplate: (url, user) =>
      forgotPasswordEmailTemplate({
        name: user.name, // Access user data natively here!
        resetUrl: url,
      }),
  });
};

const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const tokenHash = hashToken(token);

  const verification = await VerificationRepository.consumeToken(
    tokenHash,
    VERIFICATION_TYPE.PASSWORD_RESET
  );

  if (!verification) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired password reset token.');
  }

  const user = await AuthRepository.findUserByIdWithPassword(verification.userId);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  const isSamePassword = await comparePassword(newPassword, user.password);

  if (isSamePassword) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'New password must be different from the current password.'
    );
  }

  const hashedNewPassword = await hashPassword(newPassword);

  const updatedUser = await AuthRepository.updatePassword(user._id, hashedNewPassword);

  if (!updatedUser) {
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to update password.');
  }

  await SessionService.revokeAllSessions(user._id);
};

export const VerificationService = {
  sendVerificationEmail,
  verifyEmail,
  sendPasswordResetEmail,
  resetPassword,
};
