import ms, { type StringValue } from 'ms';
import { config } from '../../shared/config/env.js';
import type { CookieOptions } from 'express';

export const getRefreshTokenExpiry = (): Date =>
  new Date(Date.now() + ms(config.JWT.JWT_REFRESH_EXPIRES_IN as StringValue));

export const getRefreshTokenMaxAge = (): number =>
  ms(config.JWT.JWT_REFRESH_EXPIRES_IN as StringValue);

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
