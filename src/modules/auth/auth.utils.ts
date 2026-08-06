import ms, { type StringValue } from 'ms';
import { config } from '../../config/env.js';

export const getRefreshTokenExpiry = (): Date =>
  new Date(Date.now() + ms(config.JWT.JWT_REFRESH_EXPIRES_IN as StringValue));

export const getRefreshTokenMaxAge = (): number =>
  ms(config.JWT.JWT_REFRESH_EXPIRES_IN as StringValue);
