import { config } from '../../config/env.js';

export const getRefreshTokenExpiry = (): Date =>
  new Date(Date.now() + config.JWT.JWT_REFRESH_EXPIRES_IN);
