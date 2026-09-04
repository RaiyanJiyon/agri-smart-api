import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HTTP_STATUS } from '../constants/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/index.js';

interface CustomErrorObject {
  statusCode?: number;
  message?: string;
  code?: string;
  isOperational?: boolean;
  stack?: string;
  name?: string;
  path?: string;
  value?: unknown;
  msBeforeNext?: number;
  retryAfter?: number;
  [key: string]: unknown;
}

interface ErrorSource {
  path: string | number | symbol;
  message: string;
}

export const globalErrorHandler = (
  err: CustomErrorObject | ZodError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let errorSources: ErrorSource[] = [];
  let retryAfter: number | undefined;

  // Handle Custom ApiError or errors with a status code property
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
  }

  // Handle errors with a message property
  if ('message' in err && typeof err.message === 'string') {
    message = err.message;
  }

  // Handle Rate Limit (RateLimiterRes / HTTP 429) errors
  if ('msBeforeNext' in err && typeof err.msBeforeNext === 'number') {
    statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
    message = 'Too many requests. Please try again later.';
    retryAfter = Math.ceil(err.msBeforeNext / 1000) || 1;
    res.setHeader('Retry-After', retryAfter);
    errorSources = [
      {
        path: 'rate_limit',
        message: `Rate limit exceeded. Please wait ${retryAfter} second(s) before retrying.`,
      },
    ];
  } else if ('retryAfter' in err && typeof err.retryAfter === 'number') {
    retryAfter = err.retryAfter;
    res.setHeader('Retry-After', retryAfter);
  } else if (statusCode === HTTP_STATUS.TOO_MANY_REQUESTS) {
    message = message || 'Too many requests. Please try again later.';
    errorSources =
      errorSources.length > 0
        ? errorSources
        : [
            {
              path: 'rate_limit',
              message: 'Rate limit exceeded. Please try again later.',
            },
          ];
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
  const isOperational =
    ('isOperational' in err && err.isOperational) ||
    err instanceof ZodError ||
    statusCode < HTTP_STATUS.INTERNAL_SERVER_ERROR;

  if (!isOperational) {
    logger.error('UNEXPECTED CRITICAL ERROR:', { message: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(errorSources.length > 0 && { errorSources }),
    ...(retryAfter !== undefined && { retryAfter }),
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
