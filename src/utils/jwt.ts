import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JwtPayload } from '../shared/types/jwt.js';
import { config } from '../config/env.js';

const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.JWT.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
};

const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.JWT.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
};

const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT.JWT_ACCESS_SECRET) as JwtPayload;
};

const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT.JWT_REFRESH_SECRET) as JwtPayload;
};

export const JwtUtil = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
