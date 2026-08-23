import '../../../../src/app/types/express.d.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { auth } from '../../../../src/app/shared/middleware/auth.js';
import { JwtUtil } from '../../../../src/app/shared/utils/jwt.js';
import { ApiError } from '../../../../src/app/shared/errors/ApiError.js';

// ─── Mock JwtUtil so no real JWT secrets or signing is required ───────────────

vi.mock('../../../../src/app/shared/utils/jwt.js', () => ({
  JwtUtil: {
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
  },
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Creates a minimal mock Express Request with an optional
 * Authorization header value.
 */
const makeMockRequest = (authHeader?: string): Request => {
  return {
    headers: {
      authorization: authHeader,
    },
    user: undefined,
  } as unknown as Request;
};

/** Creates a minimal mock Express Response (unused by the middleware). */
const makeMockResponse = (): Response => ({}) as Response;

/**
 * Creates a vi.fn() that acts as Express's NextFunction.
 * Use `next.mock.calls[0][0]` to inspect what was passed to next().
 */
const makeMockNext = (): NextFunction => vi.fn() as NextFunction;

// ─── Shared decoded payload fixture ───────────────────────────────────────────

const DECODED_FARMER = {
  userId: 'user-id-123',
  email: 'farmer@example.com',
  role: 'farmer' as const,
};

const DECODED_ADMIN = {
  userId: 'admin-id-456',
  email: 'admin@example.com',
  role: 'admin' as const,
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('auth() middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 1. Missing Authorization header ───────────────────────────────────────

  it('should call next with HTTP 401 when the Authorization header is missing', () => {
    const req = makeMockRequest(undefined);
    const res = makeMockResponse();
    const next = makeMockNext();

    auth()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('You are not authorized! Access token missing.');

    // verifyAccessToken must never be reached
    expect(JwtUtil.verifyAccessToken).not.toHaveBeenCalled();
  });

  // ─── 2. Header present but wrong scheme (not "Bearer ") ────────────────────

  it('should call next with HTTP 401 when the Authorization header does not start with "Bearer "', () => {
    const req = makeMockRequest('Basic dXNlcjpwYXNz');
    const res = makeMockResponse();
    const next = makeMockNext();

    auth()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('You are not authorized! Access token missing.');

    expect(JwtUtil.verifyAccessToken).not.toHaveBeenCalled();
  });

  // ─── 3. "Bearer " prefix with no token after it ────────────────────────────

  it('should call next with HTTP 401 when the header is "Bearer " with no token', () => {
    // split(' ')[1] will be an empty string '' which is falsy
    const req = makeMockRequest('Bearer ');
    const res = makeMockResponse();
    const next = makeMockNext();

    auth()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('You are not authorized! Access token missing.');

    expect(JwtUtil.verifyAccessToken).not.toHaveBeenCalled();
  });

  // ─── 4. verifyAccessToken throws a generic (non-ApiError) error ────────────

  it('should call next with a generic HTTP 401 ApiError when verifyAccessToken throws a non-ApiError', () => {
    const req = makeMockRequest('Bearer invalid.jwt.token');
    const res = makeMockResponse();
    const next = makeMockNext();

    vi.mocked(JwtUtil.verifyAccessToken).mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    auth()(req, res, next);

    expect(JwtUtil.verifyAccessToken).toHaveBeenCalledWith('invalid.jwt.token');

    expect(next).toHaveBeenCalledTimes(1);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid or expired access token.');
  });

  // ─── 5. verifyAccessToken throws an ApiError (e.g. token expired) ──────────

  it('should forward the original ApiError to next when verifyAccessToken throws one', () => {
    const req = makeMockRequest('Bearer expired.jwt.token');
    const res = makeMockResponse();
    const next = makeMockNext();

    const originalError = new ApiError(401, 'Token has expired.');

    vi.mocked(JwtUtil.verifyAccessToken).mockImplementation(() => {
      throw originalError;
    });

    auth()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ApiError;
    // Must be the exact same error object, not a wrapped one
    expect(error).toBe(originalError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Token has expired.');
  });

  // ─── 6. Valid token, no required roles → req.user populated, next() called ─

  it('should populate req.user and call next() without an error when the token is valid and no roles are required', () => {
    const req = makeMockRequest('Bearer valid.jwt.token');
    const res = makeMockResponse();
    const next = makeMockNext();

    vi.mocked(JwtUtil.verifyAccessToken).mockReturnValue(DECODED_FARMER);

    // auth() with no role arguments
    auth()(req, res, next);

    expect(JwtUtil.verifyAccessToken).toHaveBeenCalledWith('valid.jwt.token');

    // next must be called with NO arguments (i.e., no error)
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();

    // req.user must be the decoded payload
    expect(req.user).toEqual(DECODED_FARMER);
  });

  // ─── 7. Valid token, required role matches decoded role ─────────────────────

  it('should call next() without an error when the required role matches the decoded token role', () => {
    const req = makeMockRequest('Bearer valid.jwt.token');
    const res = makeMockResponse();
    const next = makeMockNext();

    vi.mocked(JwtUtil.verifyAccessToken).mockReturnValue(DECODED_FARMER);

    auth('farmer')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(DECODED_FARMER);
  });

  // ─── 8. Valid token, but role does NOT match ────────────────────────────────

  it('should call next with HTTP 403 when the decoded role is not in the required roles list', () => {
    const req = makeMockRequest('Bearer valid.jwt.token');
    const res = makeMockResponse();
    const next = makeMockNext();

    // Token belongs to a farmer but the route requires admin
    vi.mocked(JwtUtil.verifyAccessToken).mockReturnValue(DECODED_FARMER);

    auth('admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('You do not have permission to access this resource.');
  });

  // ─── 9. Multiple required roles — one matches ───────────────────────────────

  it('should call next() without an error when one of several required roles matches', () => {
    const req = makeMockRequest('Bearer valid.jwt.token');
    const res = makeMockResponse();
    const next = makeMockNext();

    vi.mocked(JwtUtil.verifyAccessToken).mockReturnValue(DECODED_ADMIN);

    // Route is accessible by both farmers and admins
    auth('farmer', 'admin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(DECODED_ADMIN);
  });

  // ─── 10. Multiple required roles — none match ───────────────────────────────

  it('should call next with HTTP 403 when none of the required roles match the decoded role', () => {
    const req = makeMockRequest('Bearer valid.jwt.token');
    const res = makeMockResponse();
    const next = makeMockNext();

    // Token belongs to a farmer but the route requires admin or superadmin
    vi.mocked(JwtUtil.verifyAccessToken).mockReturnValue(DECODED_FARMER);

    auth('admin', 'superadmin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('You do not have permission to access this resource.');
  });

  // ─── 11. req.user is NOT set when role check fails ─────────────────────────

  it('should NOT assign req.user before calling next with an error when the role check fails', () => {
    const req = makeMockRequest('Bearer valid.jwt.token');
    const res = makeMockResponse();
    const next = makeMockNext();

    vi.mocked(JwtUtil.verifyAccessToken).mockReturnValue(DECODED_FARMER);

    auth('admin')(req, res, next);

    // req.user IS still set (decoded happens before role check in the source),
    // but an error IS forwarded — next must NOT have been called without args
    expect(next).not.toHaveBeenCalledWith();
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0] as ApiError;
    expect(error.statusCode).toBe(403);
  });

  // ─── 12. verifyAccessToken receives exactly the extracted token string ──────

  it('should pass only the token string (without "Bearer " prefix) to verifyAccessToken', () => {
    const rawToken = 'eyJhbGciOiJIUzI1NiJ9.payload.signature';

    const req = makeMockRequest(`Bearer ${rawToken}`);
    const res = makeMockResponse();
    const next = makeMockNext();

    vi.mocked(JwtUtil.verifyAccessToken).mockReturnValue(DECODED_FARMER);

    auth()(req, res, next);

    // Must be called with the raw token string, NOT with the full header value
    expect(JwtUtil.verifyAccessToken).toHaveBeenCalledWith(rawToken);
    expect(JwtUtil.verifyAccessToken).not.toHaveBeenCalledWith(`Bearer ${rawToken}`);
  });
});
