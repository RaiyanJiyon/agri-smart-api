import { config } from '../../config/env.js';

const parseDurationToMs = (duration: string): number => {
  const match = duration.match(/^(\d+)\s*([a-z]+)?$/i);
  if (!match || !match[1]) return 30 * 24 * 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2]?.toLowerCase();

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000;
    case 'y':
      return value * 365 * 24 * 60 * 60 * 1000;
    default:
      return value;
  }
};

export const getRefreshTokenExpiry = (): Date =>
  new Date(Date.now() + parseDurationToMs(config.JWT.JWT_REFRESH_EXPIRES_IN));
