import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z, ZodError } from 'zod';
import { globalErrorHandler } from '../../../../src/app/shared/middleware/globalErrorHandler.js';
import { notFound } from '../../../../src/app/shared/middleware/notFound.js';
import { ApiError } from '../../../../src/app/shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../../../src/app/shared/constants/httpStatus.js';

describe('globalErrorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };
    nextFn = vi.fn();
  });

  it('should handle custom ApiError', () => {
    const error = new ApiError(HTTP_STATUS.BAD_REQUEST, 'Custom error message');

    globalErrorHandler(error, mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        status: HTTP_STATUS.BAD_REQUEST,
        message: 'Custom error message',
      })
    );
  });

  it('should handle Rate Limiter errors with msBeforeNext', () => {
    const rateLimitErr = {
      msBeforeNext: 5000,
    };

    globalErrorHandler(rateLimitErr, mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', 5);
    expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        retryAfter: 5,
        errorSources: [
          {
            path: 'rate_limit',
            message: 'Rate limit exceeded. Please wait 5 second(s) before retrying.',
          },
        ],
      })
    );
  });

  it('should handle errors with retryAfter property', () => {
    const err = {
      retryAfter: 10,
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    };

    globalErrorHandler(err, mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', 10);
    expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
  });

  it('should handle status 429 without pre-existing error sources', () => {
    const err = {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message: 'Limit reached',
    };

    globalErrorHandler(err, mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Limit reached',
        errorSources: [
          {
            path: 'rate_limit',
            message: 'Rate limit exceeded. Please try again later.',
          },
        ],
      })
    );
  });

  it('should handle Zod Validation errors', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    let zodErr: ZodError | null = null;

    try {
      schema.parse({ email: 'invalid-email' });
    } catch (err) {
      if (err instanceof ZodError) {
        zodErr = err;
      }
    }

    expect(zodErr).not.toBeNull();

    if (zodErr) {
      globalErrorHandler(zodErr, mockReq as Request, mockRes as Response, nextFn);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Validation Error',
          errorSources: [
            expect.objectContaining({
              path: 'email',
            }),
          ],
        })
      );
    }
  });

  it('should handle Mongoose ValidationError', () => {
    const validationErr = {
      name: 'ValidationError',
      message: 'Mongoose validation failed',
    };

    globalErrorHandler(validationErr, mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation Error',
      })
    );
  });

  it('should handle Mongoose CastError', () => {
    const castErr = {
      name: 'CastError',
      path: 'userId',
    };

    globalErrorHandler(castErr, mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid value for field 'userId'",
        errorSources: [
          {
            path: 'userId',
            message: 'Invalid userId format. Expected a valid identifier.',
          },
        ],
      })
    );
  });

  it('should handle Prisma P2002 duplicate key constraint error', () => {
    const prismaErr = {
      code: 'P2002',
    };

    globalErrorHandler(prismaErr, mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CONFLICT);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'A record with this field already exists.',
      })
    );
  });

  it('should handle Mongoose CastError without path property', () => {
    const castErr = {
      name: 'CastError',
    };

    globalErrorHandler(castErr, mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Invalid value for field 'field'",
        errorSources: [
          {
            path: 'field',
            message: 'Invalid field format. Expected a valid identifier.',
          },
        ],
      })
    );
  });

  it('should handle non-operational internal server errors', () => {
    const unexpectedErr = new Error('Database connection failed');

    globalErrorHandler(unexpectedErr, mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Database connection failed',
      })
    );
  });
});

describe('notFound middleware', () => {
  it('should pass ApiError 404 to next()', () => {
    const req = { originalUrl: '/api/v1/unknown-endpoint' } as Request;
    const res = {} as Response;
    const next = vi.fn();

    notFound(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Not Found - /api/v1/unknown-endpoint',
      })
    );
  });
});
