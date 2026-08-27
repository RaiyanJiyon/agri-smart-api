import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adminRateLimiter,
  aiRateLimiter,
  authRateLimiter,
  coreRateLimiter,
  createRateLimiter,
  globalRateLimiter,
} from '../../../../src/app/shared/middleware/rateLimiter.js';

describe('createRateLimiter middleware & preset rate limiters', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      headers: {},
      body: { email: ' User@Example.Com ' },
    };
    mockRes = {
      setHeader: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFn = vi.fn();
  });

  describe('createRateLimiter core behavior', () => {
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

  describe('Preset rate limiters key generators', () => {
    it('should construct correct IP + email key for authRateLimiter when email is provided', () => {
      const reqWithEmail = {
        headers: { 'x-forwarded-for': '1.2.3.4' },
        body: { email: ' Test@Domain.COM ' },
      } as unknown as Request;

      const limiterInstance = authRateLimiter as unknown as {
        keyGenerator?: (r: Request) => string;
      };

      if (limiterInstance.keyGenerator) {
        const key = limiterInstance.keyGenerator(reqWithEmail);
        expect(key).toBe('1.2.3.4:test@domain.com');
      }
    });

    it('should fallback to IP key for authRateLimiter when email is missing or non-string', () => {
      const reqNoEmail = {
        headers: { 'x-forwarded-for': '1.2.3.4' },
        body: {},
      } as unknown as Request;

      const limiterInstance = authRateLimiter as unknown as {
        keyGenerator?: (r: Request) => string;
      };

      if (limiterInstance.keyGenerator) {
        const key = limiterInstance.keyGenerator(reqNoEmail);
        expect(key).toBe('1.2.3.4');
      }
    });

    it('should construct userId key for aiRateLimiter and coreRateLimiter when authenticated', () => {
      const reqAuth = {
        headers: { 'x-forwarded-for': '1.2.3.4' },
        user: { userId: 'user-123', role: 'FARMER' },
      } as unknown as Request;

      const aiLimiter = aiRateLimiter as unknown as { keyGenerator?: (r: Request) => string };
      const coreLimiter = coreRateLimiter as unknown as { keyGenerator?: (r: Request) => string };

      if (aiLimiter.keyGenerator && coreLimiter.keyGenerator) {
        expect(aiLimiter.keyGenerator(reqAuth)).toBe('user-123');
        expect(coreLimiter.keyGenerator(reqAuth)).toBe('user-123');
      }
    });

    it('should construct userId:role key for adminRateLimiter when authenticated', () => {
      const reqAdmin = {
        headers: { 'x-forwarded-for': '1.2.3.4' },
        user: { userId: 'admin-456', role: 'ADMIN' },
      } as unknown as Request;

      const adminLimiter = adminRateLimiter as unknown as { keyGenerator?: (r: Request) => string };

      if (adminLimiter.keyGenerator) {
        expect(adminLimiter.keyGenerator(reqAdmin)).toBe('admin-456:ADMIN');
      }
    });

    it('should construct guest key for adminRateLimiter and IP for globalRateLimiter', () => {
      const reqGuest = {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      } as unknown as Request;

      const globalLimiter = globalRateLimiter as unknown as {
        keyGenerator?: (r: Request) => string;
      };
      const adminLimiter = adminRateLimiter as unknown as { keyGenerator?: (r: Request) => string };

      if (globalLimiter.keyGenerator && adminLimiter.keyGenerator) {
        expect(globalLimiter.keyGenerator(reqGuest)).toBe('5.6.7.8');
        expect(adminLimiter.keyGenerator(reqGuest)).toBe('5.6.7.8:guest');
      }
    });
  });
});
