import argon2 from 'argon2';
import { config } from '../config/index.js';

// Secure default parameters recommended by OWASP
const ARGON2_OPTIONS = {
  type: argon2.argon2id, // Hybrid variant safe against side-channel and GPU attacks
  memoryCost: config.SECURITY.ARGON2_MEMORY,
  timeCost: config.SECURITY.ARGON2_TIME,
  parallelism: config.SECURITY.ARGON2_PARALLELISM,
} as const;

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, ARGON2_OPTIONS);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!hashedPassword) {
    throw new Error('Hashed password must be a non-empty string.');
  }

  // CRITICAL: Argon2 order is (hashedPassword, plainPassword)
  return argon2.verify(hashedPassword, plainPassword);
};
