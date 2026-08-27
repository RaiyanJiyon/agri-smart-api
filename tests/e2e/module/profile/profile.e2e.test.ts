/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../../../src/app.js';
import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { ProfileModel } from '../../../../src/app/modules/profile/profile.model.js';
import { USER_ROLE, USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

describe('Profile API E2E', () => {
  let userToken: string;
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    userId = new mongoose.Types.ObjectId();
    const hashedPassword = await hashPassword('Password123!');

    await AuthModel.create({
      _id: userId,
      name: 'Farmer John',
      email: 'john@example.com',
      password: hashedPassword,
      role: USER_ROLE.FARMER,
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
      passwordChangedAt: new Date(),
    });

    await ProfileModel.create({
      userId,
      firstName: 'John',
      lastName: 'Doe',
      address: 'Dhaka, Bangladesh',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'john@example.com',
      password: 'Password123!',
    });

    expect(loginRes.status).toBe(200);
    userToken = loginRes.body.data.accessToken;
  });

  describe('GET /api/v1/profile/me', () => {
    it('should return profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('John');
      expect(res.body.data.lastName).toBe('Doe');
    });

    it('should return 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/profile/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/profile/me', () => {
    it('should update profile fields for authenticated user', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Johnny',
          lastName: 'Smith',
          address: 'Sylhet, Bangladesh',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Johnny');
      expect(res.body.data.lastName).toBe('Smith');

      const updatedProfile = await ProfileModel.findOne({ userId });
      expect(updatedProfile?.firstName).toBe('Johnny');
    });

    it('should return 400 Bad Request when payload is invalid', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 Unauthorized when unauthenticated', async () => {
      const res = await request(app).patch('/api/v1/profile/me').send({
        firstName: 'Johnny',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
