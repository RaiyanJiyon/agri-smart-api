/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../../../src/app.js';
import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { ProfileModel } from '../../../../src/app/modules/profile/profile.model.js';
import { AdminActivityModel } from '../../../../src/app/modules/admin/admin-activity/admin-activity.model.js';
import { USER_ROLE, USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import { ADMIN_ACTIVITY_ACTION } from '../../../../src/app/modules/admin/admin.constant.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

describe('Admin API', () => {
  let adminToken: string;
  let farmerToken: string;
  let adminUserId: mongoose.Types.ObjectId;
  let farmerUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    adminUserId = new mongoose.Types.ObjectId();
    farmerUserId = new mongoose.Types.ObjectId();

    const hashedPassword = await hashPassword('Password123!');

    // Create Admin User
    await AuthModel.create({
      _id: adminUserId,
      name: 'System Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: USER_ROLE.ADMIN,
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
      passwordChangedAt: new Date(),
    });

    await ProfileModel.create({
      userId: adminUserId,
      firstName: 'System',
      lastName: 'Admin',
      address: 'Dhaka, Bangladesh',
    });

    // Create Farmer User
    await AuthModel.create({
      _id: farmerUserId,
      name: 'Regular Farmer',
      email: 'farmer@example.com',
      password: hashedPassword,
      role: USER_ROLE.FARMER,
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
      passwordChangedAt: new Date(),
    });

    await ProfileModel.create({
      userId: farmerUserId,
      firstName: 'Regular',
      lastName: 'Farmer',
      address: 'Rangpur, Bangladesh',
    });

    // Login Admin
    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'Password123!',
    });
    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.data.accessToken;

    // Login Farmer
    const farmerLoginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'farmer@example.com',
      password: 'Password123!',
    });
    expect(farmerLoginRes.status).toBe(200);
    farmerToken = farmerLoginRes.body.data.accessToken;
  });

  // ============================================================
  // RBAC Guards
  // ============================================================

  describe('RBAC Authorization Guards', () => {
    it('should return 401 Unauthorized when request is unauthenticated', async () => {
      const response = await request(app).get('/api/v1/admin/users');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 Forbidden when a farmer attempts to access admin endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET /api/v1/admin/users
  // ============================================================

  describe('GET /api/v1/admin/users', () => {
    it('should list users with pagination for admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter users by search term', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users?search=farmer@example.com')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].email).toBe('farmer@example.com');
    });
  });

  // ============================================================
  // GET /api/v1/admin/users/:userId
  // ============================================================

  describe('GET /api/v1/admin/users/:userId', () => {
    it('should return user details by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/users/${farmerUserId.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('farmer@example.com');
    });

    it('should return 404 Not Found when user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/admin/users/${nonExistentId.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // PATCH /api/v1/admin/users/:userId/status
  // ============================================================

  describe('PATCH /api/v1/admin/users/:userId/status', () => {
    it('should allow admin to block a farmer account', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/users/${farmerUserId.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: USER_STATUS.BLOCKED });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(USER_STATUS.BLOCKED);

      const updatedUser = await AuthModel.findById(farmerUserId);
      expect(updatedUser?.status).toBe(USER_STATUS.BLOCKED);
    });

    it('should return 403 Forbidden when attempting to modify an admin account', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId.toString()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: USER_STATUS.BLOCKED });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Administrator accounts cannot be modified');
    });
  });

  // ============================================================
  // GET /api/v1/admin/dashboard/statistics
  // ============================================================

  describe('GET /api/v1/admin/dashboard/statistics', () => {
    it('should return system-wide dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/v1/admin/dashboard/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(2);
      expect(response.body.data.activeUsers).toBe(2);
    });
  });

  // ============================================================
  // GET /api/v1/admin/ai-usage/statistics
  // ============================================================

  describe('GET /api/v1/admin/ai-usage/statistics', () => {
    it('should return AI usage statistics', async () => {
      const response = await request(app)
        .get('/api/v1/admin/ai-usage/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRequests).toBeDefined();
    });
  });

  // ============================================================
  // GET /api/v1/admin/activity
  // ============================================================

  describe('GET /api/v1/admin/activity', () => {
    it('should return audit activity logs for admin', async () => {
      await AdminActivityModel.create({
        adminId: adminUserId,
        targetUserId: farmerUserId,
        action: ADMIN_ACTIVITY_ACTION.BLOCK_USER,
        metadata: { reason: 'Test block' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      const response = await request(app)
        .get('/api/v1/admin/activity')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.activities).toHaveLength(1);
    });

    it('should return activity log details by ID', async () => {
      const activity = await AdminActivityModel.create({
        adminId: adminUserId,
        targetUserId: farmerUserId,
        action: ADMIN_ACTIVITY_ACTION.VIEW_USER,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      const response = await request(app)
        .get(`/api/v1/admin/activity/${activity._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe(ADMIN_ACTIVITY_ACTION.VIEW_USER);
    });
  });
});
