import type { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from "../constants/index.js";
import { AppError } from '../errors/AppError.js';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Not Found - ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND));
};
