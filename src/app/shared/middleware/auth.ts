import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/index.js';
import { HTTP_STATUS } from '../constants/index.js';
import { JwtUtil } from '../utils/index.js';

export const auth = (...requiredRoles: string[]) => {
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

      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        throw new ApiError(
          HTTP_STATUS.FORBIDDEN,
          'You do not have permission to access this resource.'
        );
      }

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
