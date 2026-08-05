import ms, { type StringValue } from 'ms';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ApiError } from '../../errors/AppError.js';
import { generateVerificationToken, hashToken } from '../../utils/crypto.js';
import { AuthRepository } from '../auth/auth.repository.js';
import type {
  ISendVerificationEmailOptions,
  IVerification,
  VerificationType,
} from './verification.interface.js';
import { VerificationRepository } from './verification.repository.js';
import { EmailService } from '../../shared/email/index.js';
import type { Types } from 'mongoose';

export const createVerificationAndSendEmail = async ({
  email,
  type,
  expiresIn,
  subject,
  buildUrl,
  buildTemplate,
  requireUnverifiedEmail = false,
}: ISendVerificationEmailOptions): Promise<void> => {
  const user = await AuthRepository.findUserByEmail(email);

  // Prevent email enumeration
  if (!user) {
    return;
  }

  if (requireUnverifiedEmail && user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is already verified.');
  }

  const { token, tokenHash } = generateVerificationToken();

  const expiresAt = new Date(Date.now() + ms(expiresIn as StringValue));

  await VerificationRepository.createOrReplace({
    userId: user._id,
    type,
    tokenHash,
    expiresAt,
  });

  await EmailService.send({
    to: user.email,
    subject,
    html: buildTemplate(buildUrl(token), user),
  });
};

export const getActiveVerification = async (
  token: string,
  type: VerificationType
): Promise<IVerification> => {
  const tokenHash = hashToken(token);

  const verification = await VerificationRepository.findByToken(tokenHash, type);

  if (!verification) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired verification token.');
  }

  return verification;
};

export const consumeVerification = async (verificationId: Types.ObjectId): Promise<void> => {
  await VerificationRepository.markAsUsed(verificationId);
};
