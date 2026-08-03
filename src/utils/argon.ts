import argon2 from 'argon2';
import { config } from '../config/env.js';

// Secure default parameters recommended by OWASP
const ARGON2_OPTIONS = {
  type: argon2.argon2id, // Hybrid variant safe against side-channel and GPU attacks
  memoryCost: config.ARGON2_MEMORY,
  timeCost: config.ARGON2_TIME,
  parallelism: config.ARGON2_PARALLELISM,
} as const;

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password, ARGON2_OPTIONS);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  // CRITICAL: Argon2 order is (hashedPassword, plainPassword)
  return argon2.verify(hashedPassword, plainPassword);
};
