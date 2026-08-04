import { AuthRepository } from '../auth/auth.repository.js';
import { ApiError } from '../../errors/AppError.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { generateVerificationToken, hashToken } from '../../utils/crypto.js';
import { VerificationRepository } from './verification.repository.js';
import { VERIFICATION_TYPE } from './verification.constant.js';
import { config } from '../../config/env.js';
import { EmailService } from '../../shared/email/email.service.js';
import { EMAIL_SUBJECT } from '../../shared/email/email.constant.js';
import { verificationEmailTemplate } from '../../shared/email/email.template.js';

const sendVerificationEmail = async (email: string): Promise<void> => {
  const existingUser = await AuthRepository.findUserByEmail(email);

  if (!existingUser) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  if (existingUser.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is already verified.');
  }

  const { token, tokenHash } = generateVerificationToken();

  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 30 // 30 minutes
  );

  await VerificationRepository.createOrReplace({
    userId: existingUser._id,
    type: VERIFICATION_TYPE.EMAIL_VERIFICATION,
    tokenHash,
    expiresAt,
  });

  const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${token}`;

  await EmailService.send({
    to: existingUser.email,
    subject: EMAIL_SUBJECT.EMAIL_VERIFICATION,
    html: verificationEmailTemplate(verificationUrl),
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

export const VerificationService = {
  sendVerificationEmail,
  verifyEmail,
};
