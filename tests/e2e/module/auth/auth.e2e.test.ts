/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../../../src/app.js';

import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

import { AuthRepository } from '../../../../src/app/modules/auth/auth.repository.js';
import { ProfileRepository } from '../../../../src/app/modules/profile/profile.repository.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';

describe('Auth API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully and create a session', async () => {
      const password = 'Password123!';

      const hashedPassword = await hashPassword(password);

      const user = await AuthRepository.createUser({
        name: 'Test Farmer',
        email: 'farmer@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });

      await ProfileRepository.create({
        userId: user._id,
      });

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'farmer@example.com',
        password,
      });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.message).toBe('Login successful.');

      expect(response.body.data.accessToken).toEqual(expect.any(String));

      expect(response.body.data.user).toMatchObject({
        name: 'Test Farmer',
        email: 'farmer@example.com',
        isEmailVerified: true,
      });

      expect(response.headers['set-cookie']).toBeDefined();

      const cookies = response.headers['set-cookie'];

      expect(cookies).toEqual(expect.arrayContaining([expect.stringContaining('refreshToken=')]));

      const sessions = await mongoose.connection
        .collection('sessions')
        .find({
          userId: user._id,
        })
        .toArray();

      expect(sessions).toHaveLength(1);

      expect(sessions[0]?.refreshTokenHash).toEqual(expect.any(String));
      expect(sessions[0]?.refreshTokenHash).not.toBe('');
    });
  });
});
