import { AuthRepository } from '../auth/auth.repository.js';
import { ApiError } from '../../errors/AppError.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { VerificationRepository } from './verification.repository.js';
import { VERIFICATION_TYPE } from './verification.constant.js';
import { config } from '../../config/env.js';
import { EMAIL_SUBJECT } from '../../shared/email/email.constant.js';
import { verificationEmailTemplate } from '../../shared/email/email.template.js';
import { forgotPasswordEmailTemplate } from '../../shared/email/forgot-password.template.js';
import { createVerificationAndSendEmail } from './verification.utils.js';
import { hashPassword, hashToken } from '../../utils/index.js';
import { comparePassword } from '../../utils/index.js';
import { SessionService } from '../session/index.js';

const sendVerificationEmail = async (email: string): Promise<void> => {
  await createVerificationAndSendEmail({
    email,
    type: VERIFICATION_TYPE.EMAIL_VERIFICATION,
    expiresIn: config.EMAIL_VERIFICATION_EXPIRES_IN,
    subject: EMAIL_SUBJECT.EMAIL_VERIFICATION,
    buildUrl: (token) => `${config.CLIENT_URL}/verify-email?token=${token}`,
    buildTemplate: verificationEmailTemplate,
    requireUnverifiedEmail: true,
  });
};

const verifyEmail = async (token: string): Promise<void> => {
  const tokenHash = hashToken(token);

  const verification = await VerificationRepository.findByToken(
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
    expiresIn: config.PASSWORD_RESET_EXPIRES_IN,
    subject: EMAIL_SUBJECT.PASSWORD_RESET,
    buildUrl: (token) => `${config.CLIENT_URL}/reset-password?token=${token}`,
    buildTemplate: (url, user) =>
      forgotPasswordEmailTemplate({
        name: user.name, // Access user data natively here!
        resetUrl: url,
      }),
  });
};

const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const tokenHash = hashToken(token);

  const verification = await VerificationRepository.findByToken(
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

  await AuthRepository.updatePassword(user._id, hashedNewPassword);

  await SessionService.revokeAllSessions(user._id);

  await VerificationRepository.markAsUsed(verification._id);
};

export const VerificationService = {
  sendVerificationEmail,
  verifyEmail,
  sendPasswordResetEmail,
  resetPassword,
};
