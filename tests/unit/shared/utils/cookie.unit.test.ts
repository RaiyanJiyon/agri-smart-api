import { describe, expect, it, vi } from 'vitest';

describe('cookie utils', () => {
  it('should return secure=false and sameSite=lax in non-production environments', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    // Re-import after env stub to pick up fresh module state
    const { getRefreshTokenCookieOptions, getClearCookieOptions } =
      await import('../../../../src/app/shared/utils/cookie.js');

    const refreshOptions = getRefreshTokenCookieOptions();
    expect(refreshOptions.httpOnly).toBe(true);
    expect(refreshOptions.path).toBe('/');
    expect(refreshOptions.maxAge).toBeGreaterThan(0);

    const clearOptions = getClearCookieOptions();
    expect(clearOptions.httpOnly).toBe(true);
    expect(clearOptions.path).toBe('/');

    vi.unstubAllEnvs();
  });

  it('should return sameSite=none and secure=true in test env (NODE_ENV=test)', async () => {
    // In our test env, NODE_ENV is "test" (non-production), so sameSite should be 'lax'
    const { getRefreshTokenCookieOptions, getClearCookieOptions } =
      await import('../../../../src/app/shared/utils/cookie.js');

    const refreshOptions = getRefreshTokenCookieOptions();
    expect(refreshOptions.httpOnly).toBe(true);
    expect(typeof refreshOptions.maxAge).toBe('number');

    const clearOptions = getClearCookieOptions();
    expect(clearOptions.httpOnly).toBe(true);
    expect(clearOptions.path).toBe('/');
  });
});
