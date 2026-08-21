import { beforeEach, describe, vi } from 'vitest';

vi.mock('../../../../src/app/modules/session/session.repository.js', () => ({
  SessionRepository: {
    create: vi.fn(),
    findByRefreshTokenHash: vi.fn(),
    findActiveByRefreshTokenHash: vi.fn(),
    findAllByUserId: vi.fn(),
    findActiveByUserId: vi.fn(),
    revoke: vi.fn(),
    revokeAllByUserId: vi.fn(),
    revokeAllExcept: vi.fn(),
    deleteByUserId: vi.fn(),
    rotateRefreshToken: vi.fn(),
  },
}));

describe('SessionService.createSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});

describe('SessionService.findActiveSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});

describe('SessionService.revokeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});

describe('SessionService.revokeAllSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});

describe('SessionService.revokeAllExcept', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});

describe('SessionService.rotateRefreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // tests go here
});
