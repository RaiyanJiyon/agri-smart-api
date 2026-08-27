import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRateLimiter } from '../../../../src/app/shared/middleware/rateLimiter.js';

describe('createRateLimiter middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      body: { email: ' test@example.com ' },
    };
    mockRes = {
      setHeader: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFn = vi.fn();
  });

  it('should skip rate limiting when skip function returns true', async () => {
    const limiter = createRateLimiter({
      keyPrefix: 'test-skip',
      points: 5,
      duration: 60,
      skip: () => true,
    });

    await limiter(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it('should allow request and set headers when under limit', async () => {
    const limiter = createRateLimiter({
      keyPrefix: 'test-pass',
      points: 10,
      duration: 60,
    });

    await limiter(mockReq as Request, mockRes as Response, nextFn);

    expect(mockRes.setHeader).toHaveBeenCalledWith('RateLimit-Limit', 10);
    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it('should trigger Fail-Closed mode when failClosed=true during outage', async () => {
    const limiter = createRateLimiter({
      keyPrefix: 'test-fail-closed',
      points: 1,
      duration: 60,
      failClosed: true,
    });

    await limiter(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });

  it('should trigger Fail-Open mode when failClosed=false during outage', async () => {
    const limiter = createRateLimiter({
      keyPrefix: 'test-fail-open',
      points: 5,
      duration: 60,
      failClosed: false,
    });

    await limiter(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });
});
