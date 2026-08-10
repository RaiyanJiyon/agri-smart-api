import type { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../constants/index.js';
import { ApiError } from '../errors/ApiError.js';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Not Found - ${req.originalUrl}`));
};
