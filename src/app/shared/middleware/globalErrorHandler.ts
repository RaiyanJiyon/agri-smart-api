import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HTTP_STATUS } from '../constants/index.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface CustomErrorObject {
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

interface ErrorSource {
  path: string | number | symbol;
  message: string;
}

export const globalErrorHandler = (
  err: CustomErrorObject | ZodError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let errorSources: ErrorSource[] = [];

  // Handle Custom ApiError or errors with a status code property
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
  }
  if ('message' in err && typeof err.message === 'string') {
    message = err.message;
  }

  // Handle Zod Validation Errors (e.g., schema validation failures)
  if (err instanceof ZodError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation Error';
    errorSources = err.issues.map((issue) => {
      const rawPath = issue.path[issue.path.length - 1];
      const path =
        typeof rawPath === 'string' || typeof rawPath === 'number' || typeof rawPath === 'symbol'
          ? rawPath
          : '';

      return {
        path,
        message: issue.message,
      };
    });
  }
  // Handle Mongoose Validation Errors (e.g., schema validation failures)
  else if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation Error';
  }
  // Handle Mongoose Cast Errors (e.g. invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;

    const path = 'path' in err && typeof err.path === 'string' ? err.path : 'field';

    message = `Invalid value for field '${path}'`;

    errorSources = [
      {
        path,
        message: `Invalid ${String(path)} format. Expected a valid identifier.`,
      },
    ];
  }
  // Handle Unique Constraint Conflicts (e.g. Prisma P2002)
  else if ('code' in err && err.code === 'P2002') {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'A record with this field already exists.';
  }

  // Operational vs Programming error logging distinction
  const isOperational = ('isOperational' in err && err.isOperational) || err instanceof ZodError;
  if (!isOperational) {
    logger.error('UNEXPECTED CRITICAL ERROR:', { message: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    // Include field-specific error details if they exist
    ...(errorSources.length > 0 && { errorSources }),
    // Expose stack trace only in development mode for debugging
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
