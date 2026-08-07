import type { CookieOptions } from 'express';
import { config } from '../config/env.js';
import { getRefreshTokenMaxAge } from '../../modules/auth/auth.utils.js';

export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const isProduction = config.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: getRefreshTokenMaxAge(),
  };
};

export const getClearCookieOptions = (): CookieOptions => {
  const isProduction = config.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
};
