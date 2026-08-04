import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import type { IJwtPayload } from '../types/jwt.js';
import { config } from '../config/env.js';

const signAccessToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, config.JWT.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT.JWT_ACCESS_EXPIRES_IN as Secret,
  } as SignOptions);
};

const signRefreshToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, config.JWT.JWT_REFRESH_SECRET, {
    expiresIn: Math.floor(config.JWT.JWT_REFRESH_EXPIRES_IN / 1000) as unknown as Secret,
  } as SignOptions);
};

const verifyAccessToken = (token: string): IJwtPayload => {
  return jwt.verify(token, config.JWT.JWT_ACCESS_SECRET) as IJwtPayload;
};

const verifyRefreshToken = (token: string): IJwtPayload => {
  return jwt.verify(token, config.JWT.JWT_REFRESH_SECRET) as IJwtPayload;
};

export const JwtUtil = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
