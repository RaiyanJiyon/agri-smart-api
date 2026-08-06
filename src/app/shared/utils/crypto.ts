import crypto from 'node:crypto';
import { CRYPTO } from '../constants/crypto.js';

export interface IGeneratedVerificationToken {
  token: string;
  tokenHash: string;
}

//Generates a cryptographically secure random token.
export const generateRandomToken = (): string => {
  return crypto.randomBytes(CRYPTO.TOKEN_SIZE).toString('hex');
};

// Hashes a token using SHA-256.
export const hashToken = (token: string): string => {
  return crypto.createHash(CRYPTO.HASH_ALGORITHM).update(token).digest('hex');
};

/**
 * Generates a verification token and its hash.
 *
 * The raw token should be sent to the user.
 * The hash should be stored in the database.
 */
export const generateVerificationToken = (): IGeneratedVerificationToken => {
  const token = generateRandomToken();

  return {
    token,
    tokenHash: hashToken(token),
  };
};
