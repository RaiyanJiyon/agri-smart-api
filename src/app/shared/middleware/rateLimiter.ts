import type { NextFunction, Request, Response } from 'express';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { redisConnection } from '../queue/queue.connection.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { getClientIp } from '../utils/ip.utils.js';

export interface RateLimiterOptions {
  keyPrefix: string;
  points: number;
  duration: number; // in seconds
  blockDuration?: number; // in seconds (lockout period when limits breached)
  keyGenerator?: (req: Request) => string;
  failClosed?: boolean; // if true, fail-closed on Redis outage (e.g. auth endpoints)
  skip?: (req: Request) => boolean;
}

/**
 * Creates a rate limiting Express middleware powered by Redis
 * with a process-local memory fallback for high resilience.
 */
export const createRateLimiter = (options: RateLimiterOptions) => {
  const {
    keyPrefix,
    points,
    duration,
    blockDuration,
    keyGenerator = (req: Request) => getClientIp(req),
    failClosed = false,
    skip,
  } = options;

  // Primary distributed limiter using Redis
  const limiterRedis = new RateLimiterRedis({
    storeClient: redisConnection,
    keyPrefix,
    points,
    duration,
    ...(blockDuration && { blockDuration }),
  });

  // Secondary memory limiter fallback during Redis downtime
  const limiterMemory = new RateLimiterMemory({
    keyPrefix: `${keyPrefix}:fallback`,
    points,
    duration,
    ...(blockDuration && { blockDuration }),
  });

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (skip?.(req)) {
      return next();
    }

    const key = keyGenerator(req);

    try {
      // Attempt rate limit check against Redis
      const rateLimiterRes = await limiterRedis.consume(key);

      setRateLimitHeaders(res, points, rateLimiterRes);
      return next();
    } catch (errorOrRes: unknown) {
      if (errorOrRes instanceof RateLimiterRes) {
        // Rate limit exceeded via Redis
        return handleRateLimitExceeded(res, points, errorOrRes);
      }

      // Redis connectivity / system failure
      logger.warn(
        `[RateLimiter] Redis connection error on prefix '${keyPrefix}': ${
          errorOrRes instanceof Error ? errorOrRes.message : String(errorOrRes)
        }`
      );

      // Attempt local in-memory fallback check
      try {
        const memoryRes = await limiterMemory.consume(key);
        setRateLimitHeaders(res, points, memoryRes);
        return next();
      } catch (fallbackErrorOrRes: unknown) {
        if (fallbackErrorOrRes instanceof RateLimiterRes) {
          return handleRateLimitExceeded(res, points, fallbackErrorOrRes);
        }

        // Infrastructure outage failure mode
        if (failClosed) {
          logger.error(
            `[RateLimiter] Fail-Closed triggered for '${keyPrefix}' on key '${key}' due to infrastructure failure.`
          );
          res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
            success: false,
            status: HTTP_STATUS.TOO_MANY_REQUESTS,
            message: 'Service security policy enforced. Please try again shortly.',
            errorSources: [
              {
                path: 'rate_limit',
                message: 'Rate limiting service temporary degradation. Request blocked.',
              },
            ],
          });
          return;
        }

        // Fail-Open mode (for non-critical routes)
        logger.info(`[RateLimiter] Fail-Open granted for '${keyPrefix}' on key '${key}'.`);
        return next();
      }
    }
  };
};

/**
 * Sets IETF / RFC compliant rate limit tracking headers on responses.
 */
const setRateLimitHeaders = (
  res: Response,
  points: number,
  rateLimiterRes: RateLimiterRes
): void => {
  const resetSeconds = Math.ceil(rateLimiterRes.msBeforeNext / 1000);
  const resetEpoch = Math.floor(Date.now() / 1000) + resetSeconds;

  res.setHeader('RateLimit-Limit', points);
  res.setHeader('RateLimit-Remaining', Math.max(0, rateLimiterRes.remainingPoints));
  res.setHeader('RateLimit-Reset', resetEpoch);
};

/**
 * Standardized HTTP 429 response handler.
 */
const handleRateLimitExceeded = (
  res: Response,
  points: number,
  rateLimiterRes: RateLimiterRes
): void => {
  const retryAfterSeconds = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 1;
  const resetEpoch = Math.floor(Date.now() / 1000) + retryAfterSeconds;

  res.setHeader('RateLimit-Limit', points);
  res.setHeader('RateLimit-Remaining', 0);
  res.setHeader('RateLimit-Reset', resetEpoch);
  res.setHeader('Retry-After', retryAfterSeconds);

  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    status: HTTP_STATUS.TOO_MANY_REQUESTS,
    message: 'Too many requests. Please try again later.',
    errorSources: [
      {
        path: 'rate_limit',
        message: `Rate limit exceeded. Please wait ${retryAfterSeconds} second(s) before retrying.`,
      },
    ],
    retryAfter: retryAfterSeconds,
  });
};

/* ==========================================================================
 * PRESET RATE LIMITERS FOR APPLICATION TIERS
 * ========================================================================== */

/**
 * Tier 4: Global Rate Limiter Baseline (IP-based)
 */
export const globalRateLimiter = createRateLimiter({
  keyPrefix: 'rl:global',
  points: config.RATE_LIMIT.GLOBAL_POINTS,
  duration: config.RATE_LIMIT.GLOBAL_DURATION,
  keyGenerator: (req) => getClientIp(req),
});

/**
 * Tier 0: Authentication & Credential Hardening (IP + Email, Fail-Closed)
 */
export const authRateLimiter = createRateLimiter({
  keyPrefix: 'rl:auth',
  points: config.RATE_LIMIT.AUTH_POINTS,
  duration: config.RATE_LIMIT.AUTH_DURATION,
  blockDuration: config.RATE_LIMIT.AUTH_BLOCK_DURATION,
  failClosed: true,
  keyGenerator: (req) => {
    const body: unknown = req.body;
    let rawEmail = '';
    if (body && typeof body === 'object' && 'email' in body && typeof body.email === 'string') {
      rawEmail = body.email.trim().toLowerCase();
    }
    const ip = getClientIp(req);
    return rawEmail !== '' ? `${ip}:${rawEmail}` : ip;
  },
});

/**
 * Tier 1: AI & Heavy Compute Operations (User-based)
 */
export const aiRateLimiter = createRateLimiter({
  keyPrefix: 'rl:ai',
  points: config.RATE_LIMIT.AI_POINTS,
  duration: config.RATE_LIMIT.AI_DURATION,
  keyGenerator: (req) => req.user?.userId ?? getClientIp(req),
});

/**
 * Tier 2: Authenticated Core API Operations (User-based)
 */
export const coreRateLimiter = createRateLimiter({
  keyPrefix: 'rl:core',
  points: config.RATE_LIMIT.CORE_POINTS,
  duration: config.RATE_LIMIT.CORE_DURATION,
  keyGenerator: (req) => req.user?.userId ?? getClientIp(req),
});

/**
 * Tier 3: Admin Operations (User + Role based)
 */
export const adminRateLimiter = createRateLimiter({
  keyPrefix: 'rl:admin',
  points: config.RATE_LIMIT.ADMIN_POINTS,
  duration: config.RATE_LIMIT.ADMIN_DURATION,
  keyGenerator: (req) => `${req.user?.userId ?? getClientIp(req)}:${req.user?.role ?? 'guest'}`,
});
