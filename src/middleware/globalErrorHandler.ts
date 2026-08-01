import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from '../constants/statusCodes.js';
import { envVars } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface AppError {
  statusCode?: number;
  message?: string;
  code?: string;
  isOperational?: boolean;
  stack?: string;
  name?: string;
  path?: string;
  value?: unknown;
  [key: string]: unknown;
}

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message ?? 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Cast Error';
    // message = `Invalid ${err.path ?? "value"}: ${String(err.value ?? "")}`;
  } else if (err.code === 'P2002') {
    statusCode = StatusCodes.CONFLICT;
    message = 'A record with this field already exists.';
  }

  // Operational vs Programming error logging distinction
  if (!err.isOperational) {
    // Log unexpected bugs to an external monitoring tool (e.g., Sentry, Datadog)
    logger.error('UNEXPECTED CRITICAL ERROR:', { message: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    // Expose stack trace only in development mode for debugging
    ...(envVars.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
