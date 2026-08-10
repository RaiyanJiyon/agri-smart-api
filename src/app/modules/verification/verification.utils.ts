import ms, { type StringValue } from 'ms';
import { AuthRepository } from '../auth/auth.repository.js';
import type {
  SendVerificationEmailOptions,
  Verification,
  VerificationType,
} from './verification.interface.js';
import { VerificationRepository } from './verification.repository.js';
import { EmailService } from '../../shared/email/index.js';
import type { Types } from 'mongoose';
import { ApiError } from '../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { generateVerificationToken, hashToken } from '../../shared/utils/crypto.js';

/**
 * * HELPER: Creates a verification token, saves its hash to the database,
 * * and sends an email containing the verification link to the user.
 */
export const createVerificationAndSendEmail = async ({
  email,
  type,
  expiresIn,
  subject,
  buildUrl,
  buildTemplate,
  requireUnverifiedEmail = false,
}: SendVerificationEmailOptions): Promise<void> => {
  const existingUser = await AuthRepository.findUserByEmail(email);

  // Prevent email enumeration
  if (!existingUser) {
    return;
  }

  if (requireUnverifiedEmail && existingUser.isEmailVerified) {
    return;
  }

  // Clear out any existing verification records of the same type for the user to ensure only one active token exists at a time.
  await VerificationRepository.deleteByUserAndType(existingUser._id, type);

  const { token, tokenHash } = generateVerificationToken();

  const expiresAt = new Date(Date.now() + ms(expiresIn as StringValue));

  await VerificationRepository.createOrReplace({
    userId: existingUser._id,
    type,
    tokenHash,
    expiresAt,
  });

  await EmailService.send({
    to: existingUser.email,
    subject,
    html: buildTemplate(buildUrl(token), existingUser),
  });
};

/**
 * * HELPER: Finds and returns an active, unexpired, and unused verification record
 * * matching the provided token and verification type.
 */
export const getActiveVerification = async (
  token: string,
  type: VerificationType
): Promise<Verification> => {
  const tokenHash = hashToken(token);

  const verification = await VerificationRepository.findByToken(tokenHash, type);

  if (!verification) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired verification token.');
  }

  return verification;
};

/**
 * * HELPER: Marks a specific verification record as used to prevent token reuse.
 */
export const consumeVerification = async (verificationId: Types.ObjectId): Promise<void> => {
  await VerificationRepository.markAsUsed(verificationId);
};
