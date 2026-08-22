import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../setup.js';

import { SessionRepository } from '../../../../src/app/modules/session/session.repository.js';

describe('SessionRepository integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should create a session in MongoDB', async () => {
    const userId = new mongoose.Types.ObjectId();

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const session = await SessionRepository.create({
      userId,
      refreshTokenHash: 'hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt,
    });

    expect(session).toBeDefined();
    expect(session.userId).toEqual(userId);
    expect(session.refreshTokenHash).toBe('hashed-refresh-token');
    expect(session.ipAddress).toBe('127.0.0.1');
    expect(session.userAgent).toBe('Vitest');
    expect(session.expiresAt).toEqual(expiresAt);
  });
});
