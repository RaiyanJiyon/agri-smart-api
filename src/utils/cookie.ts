import ms from "ms";
import type { CookieOptions } from 'express';
import { config } from '../config/env.js';

export const getRefreshTokenCookieOptions = (env = config.NODE_ENV): CookieOptions => ({
  httpOnly: true,
  secure: env === 'production',
  sameSite: 'none',
  path: '/',
  // ms(...) can return number|string depending on overloads; ensure we pass a number
  // to `maxAge` and fail fast if the configured value is invalid.
  maxAge: (() => {
    // ms's type definitions use a narrow StringValue type which rejects plain 'string'.
    // Cast ms to a (string) => number function to accept runtime-configured strings,
    // then validate the result at runtime to remain safe.
    const msFn = ms as unknown as (value: string) => number;
    const value = msFn(config.JWT.JWT_REFRESH_EXPIRES_IN);
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new Error('Invalid JWT_REFRESH_EXPIRES_IN environment value');
    }
    return value;
  })(),
});