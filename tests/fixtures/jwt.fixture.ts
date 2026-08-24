import type { JwtPayload } from '../../src/app/shared/types/jwt.js';

export const createMockJwtPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => {
  return {
    userId: '60d5ecb8b5c9c22a3c8e4111',
    email: 'farmer@example.com',
    role: 'farmer',
    ...overrides,
  };
};
