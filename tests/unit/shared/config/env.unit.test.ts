import { describe, expect, it } from 'vitest';

import { config } from '../../../../src/app/shared/config/env.js';

describe('env config', () => {
  it('should load and freeze environment configuration object', () => {
    expect(config).toBeDefined();
    expect(Object.isFrozen(config)).toBe(true);

    expect(config.PORT).toBeGreaterThan(0);
    expect(config.NODE_ENV).toBeDefined();
    expect(config.DB_URL).toBeDefined();

    expect(Array.isArray(config.CLIENT_URL)).toBe(true);
  });

  it('should contain all configuration sections', () => {
    expect(config.SECURITY).toBeDefined();
    expect(config.MAIL).toBeDefined();
    expect(config.JWT).toBeDefined();
    expect(config.AI).toBeDefined();
    expect(config.STORAGE).toBeDefined();
    expect(config.REDIS).toBeDefined();
    expect(config.RATE_LIMIT).toBeDefined();
  });

  it('should parse numeric environment variables correctly', () => {
    expect(typeof config.PORT).toBe('number');

    expect(typeof config.SECURITY.ARGON2_MEMORY).toBe('number');
    expect(typeof config.SECURITY.ARGON2_TIME).toBe('number');
    expect(typeof config.SECURITY.ARGON2_PARALLELISM).toBe('number');

    expect(typeof config.REDIS.REDIS_PORT).toBe('number');
  });

  it('should load valid Argon2 configuration', () => {
    expect(config.SECURITY.ARGON2_MEMORY).toBeGreaterThanOrEqual(65536);
    expect(config.SECURITY.ARGON2_TIME).toBeGreaterThanOrEqual(1);
    expect(config.SECURITY.ARGON2_PARALLELISM).toBeGreaterThanOrEqual(1);
  });

  it('should load valid JWT expiration configurations', () => {
    expect(config.JWT.JWT_ACCESS_EXPIRES_IN).toMatch(/^\d+[smhd]$/);
    expect(config.JWT.JWT_REFRESH_EXPIRES_IN).toMatch(/^\d+[smhd]$/);
  });

  it('should parse CLIENT_URL into a trimmed array', () => {
    expect(Array.isArray(config.CLIENT_URL)).toBe(true);

    config.CLIENT_URL.forEach((url) => {
      expect(url).toBe(url.trim());
    });
  });

  it('should contain valid rate limit configuration', () => {
    expect(config.RATE_LIMIT.GLOBAL_POINTS).toBeGreaterThanOrEqual(1);
    expect(config.RATE_LIMIT.GLOBAL_DURATION).toBeGreaterThanOrEqual(1);

    expect(config.RATE_LIMIT.AUTH_POINTS).toBeGreaterThanOrEqual(1);
    expect(config.RATE_LIMIT.AUTH_DURATION).toBeGreaterThanOrEqual(1);
    expect(config.RATE_LIMIT.AUTH_BLOCK_DURATION).toBeGreaterThanOrEqual(1);

    expect(config.RATE_LIMIT.AI_POINTS).toBeGreaterThanOrEqual(1);
    expect(config.RATE_LIMIT.AI_DURATION).toBeGreaterThanOrEqual(1);

    expect(config.RATE_LIMIT.CORE_POINTS).toBeGreaterThanOrEqual(1);
    expect(config.RATE_LIMIT.CORE_DURATION).toBeGreaterThanOrEqual(1);

    expect(config.RATE_LIMIT.ADMIN_POINTS).toBeGreaterThanOrEqual(1);
    expect(config.RATE_LIMIT.ADMIN_DURATION).toBeGreaterThanOrEqual(1);
  });
});
