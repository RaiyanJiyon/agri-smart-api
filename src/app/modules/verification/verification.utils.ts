import ms, { type StringValue } from 'ms';
import { AuthRepository } from '../auth/index.js';
import type { SendVerificationEmailOptions } from './verification.interface.js';
import { VerificationRepository } from './verification.repository.js';
import { EmailService } from '../../shared/email/index.js';
import { generateVerificationToken } from '../../shared/utils/crypto.js';
import { escapeHtml } from '../../shared/utils/escape.js';

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

  if (!existingUser) {
    return; // Prevent email enumeration
  }

  if (requireUnverifiedEmail && existingUser.isEmailVerified) {
    return; // If the email is already verified, we don't send another verification email.
  }

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
    html: buildTemplate(buildUrl(token), {
      ...existingUser,
      name: escapeHtml(existingUser.name),
    }),
  });
};
