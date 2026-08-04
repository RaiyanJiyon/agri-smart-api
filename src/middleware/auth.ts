import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { JwtUtil } from '../utils/jwt.js';

export const auth = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        throw new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          'You are not authorized! Access token missing.'
        );
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        throw new ApiError(
          HTTP_STATUS.UNAUTHORIZED,
          'You are not authorized! Access token missing.'
        );
      }

      const decoded = JwtUtil.verifyAccessToken(token);

      req.user = decoded;

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired access token.'));
      }
    }
  };
};
