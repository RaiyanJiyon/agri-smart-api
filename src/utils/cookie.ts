import type { CookieOptions } from 'express';
import { config } from '../config/env.js';
import { getRefreshTokenMaxAge } from '../modules/auth/auth.utils.js';

export const getRefreshTokenCookieOptions = (env = config.NODE_ENV): CookieOptions => ({
  httpOnly: true,
  secure: env === 'production',
  sameSite: 'none',
  path: '/',
  maxAge: getRefreshTokenMaxAge(),
});
