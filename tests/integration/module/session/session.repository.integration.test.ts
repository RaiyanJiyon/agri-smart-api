import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

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

  it('should find a session by refresh token hash', async () => {
    const userId = new mongoose.Types.ObjectId();

    const session = await SessionRepository.create({
      userId,
      refreshTokenHash: 'hashed-refresh-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const result = await SessionRepository.findByRefreshTokenHash('hashed-refresh-token');

    expect(result).not.toBeNull();
    expect(result?._id).toEqual(session._id);
    expect(result?.userId).toEqual(userId);
  });

  it('should return null when the refresh token hash does not exist', async () => {
    const result = await SessionRepository.findByRefreshTokenHash('non-existent-token');

    expect(result).toBeNull();
  });

  it('should find an active session by refresh token hash', async () => {
    const userId = new mongoose.Types.ObjectId();

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'active-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const result = await SessionRepository.findActiveByRefreshTokenHash('active-token');

    expect(result).not.toBeNull();
    expect(result?.refreshTokenHash).toBe('active-token');
  });

  it('should not find a revoked session as active', async () => {
    const userId = new mongoose.Types.ObjectId();

    const session = await SessionRepository.create({
      userId,
      refreshTokenHash: 'revoked-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await SessionRepository.revoke(session._id);

    const result = await SessionRepository.findActiveByRefreshTokenHash('revoked-token');

    expect(result).toBeNull();
  });

  it('should not find an expired session as active', async () => {
    const userId = new mongoose.Types.ObjectId();

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'expired-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Vitest',
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const result = await SessionRepository.findActiveByRefreshTokenHash('expired-token');

    expect(result).toBeNull();
  });

  it('should find all sessions belonging to a user', async () => {
    const userId = new mongoose.Types.ObjectId();

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'token-1',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'token-2',
      ipAddress: '127.0.0.2',
      userAgent: 'Firefox',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const result = await SessionRepository.findAllByUserId(userId);

    expect(result).toHaveLength(2);
    expect(result.every((session) => session.userId.equals(userId))).toBe(true);
  });

  it('should find only active sessions for a user', async () => {
    const userId = new mongoose.Types.ObjectId();

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'active-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const revokedSession = await SessionRepository.create({
      userId,
      refreshTokenHash: 'revoked-token',
      ipAddress: '127.0.0.2',
      userAgent: 'Firefox',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await SessionRepository.revoke(revokedSession._id);

    const result = await SessionRepository.findActiveByUserId(userId);

    expect(result).toHaveLength(1);
    expect(result[0]?.refreshTokenHash).toBe('active-token');
  });

  it('should revoke an active session', async () => {
    const userId = new mongoose.Types.ObjectId();

    const session = await SessionRepository.create({
      userId,
      refreshTokenHash: 'token',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const result = await SessionRepository.revoke(session._id);

    expect(result).not.toBeNull();
    expect(result?.revokedAt).toBeInstanceOf(Date);
  });

  it('should revoke all active sessions for a user', async () => {
    const userId = new mongoose.Types.ObjectId();

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'token-1',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'token-2',
      ipAddress: '127.0.0.2',
      userAgent: 'Firefox',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await SessionRepository.revokeAllByUserId(userId);

    const result = await SessionRepository.findActiveByUserId(userId);

    expect(result).toHaveLength(0);
  });

  it('should revoke all sessions except the specified session', async () => {
    const userId = new mongoose.Types.ObjectId();

    const sessionToKeep = await SessionRepository.create({
      userId,
      refreshTokenHash: 'keep-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'revoke-token',
      ipAddress: '127.0.0.2',
      userAgent: 'Firefox',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await SessionRepository.revokeAllExcept(userId, sessionToKeep._id);

    const activeSessions = await SessionRepository.findActiveByUserId(userId);

    expect(activeSessions).toHaveLength(1);
    expect(activeSessions[0]?._id).toEqual(sessionToKeep._id);
  });

  it('should rotate the refresh token and update its expiry', async () => {
    const userId = new mongoose.Types.ObjectId();

    const session = await SessionRepository.create({
      userId,
      refreshTokenHash: 'old-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await SessionRepository.rotateRefreshToken(
      session._id,
      'new-token',
      newExpiresAt
    );

    expect(result).not.toBeNull();
    expect(result?.refreshTokenHash).toBe('new-token');
    expect(result?.expiresAt).toEqual(newExpiresAt);
    expect(result?.lastUsedAt).toBeInstanceOf(Date);
  });

  it('should delete all sessions belonging to a user', async () => {
    const userId = new mongoose.Types.ObjectId();

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'token-1',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await SessionRepository.create({
      userId,
      refreshTokenHash: 'token-2',
      ipAddress: '127.0.0.2',
      userAgent: 'Firefox',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const deleteResult = await SessionRepository.deleteByUserId(userId);

    expect(deleteResult.deletedCount).toBe(2);

    const sessions = await SessionRepository.findAllByUserId(userId);

    expect(sessions).toHaveLength(0);
  });
});
