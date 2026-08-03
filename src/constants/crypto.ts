import { config } from "../config/env.js";

export const CRYPTO = {
  TOKEN_SIZE: config.TOKEN_SIZE,
  HASH_ALGORITHM: config.HASH_ALGORITHM,
} as const;
