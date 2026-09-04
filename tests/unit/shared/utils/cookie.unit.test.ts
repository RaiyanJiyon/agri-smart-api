import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { CookieOptions } from 'express';
import * as authUtils from '../../../../src/app/modules/auth/auth.utils.js';

// Mock the config module
vi.mock('../../../../src/app/shared/config/env.js', () => ({
  config: {
    NODE_ENV: 'test',
    JWT: {
      JWT_REFRESH_EXPIRES_IN: '7d',
    },
  },
}));

describe('cookie utils', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return secure=false and sameSite=lax in non-production environments', () => {
    const refreshOptions: CookieOptions = authUtils.getRefreshTokenCookieOptions();
    expect(refreshOptions.httpOnly).toBe(true);
    expect(refreshOptions.path).toBe('/');
    expect(refreshOptions.maxAge).toBeGreaterThan(0);
    expect(refreshOptions.secure).toBe(false);
    expect(refreshOptions.sameSite).toBe('lax');
  });

  it('should return sameSite=lax and secure=false in test env (NODE_ENV=test)', () => {
    // In our test env, NODE_ENV is "test" (non-production), so sameSite should be 'lax'
    const refreshOptions: CookieOptions = authUtils.getRefreshTokenCookieOptions();
    expect(refreshOptions.httpOnly).toBe(true);
    expect(typeof refreshOptions.maxAge).toBe('number');
    expect(refreshOptions.secure).toBe(false);
    expect(refreshOptions.sameSite).toBe('lax');
  });
});
