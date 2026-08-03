import type { CookieOptions } from 'express';
import { config } from '../config/env.js';

export const getRefreshTokenCookieOptions = (env = config.NODE_ENV): CookieOptions => ({
  httpOnly: true,
  secure: env === 'production',
  sameSite: 'none',
  path: '/',
  maxAge: config.JWT.JWT_REFRESH_EXPIRES_IN,
});
