import type { CookieOptions } from 'express';
import { config } from '../config/index.js';

export const getBaseCookieOptions = (): CookieOptions => {
  const isProduction = config.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
};

export const getClearCookieOptions = (): CookieOptions => {
  return {
    ...getBaseCookieOptions(),
    maxAge: 0,
  };
};
