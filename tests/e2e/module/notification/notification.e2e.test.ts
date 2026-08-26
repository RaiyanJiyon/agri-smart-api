/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../../../src/app.js';
import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { ProfileModel } from '../../../../src/app/modules/profile/profile.model.js';
import { NotificationModel } from '../../../../src/app/modules/notification/notification.model.js';
import { USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
} from '../../../../src/app/modules/notification/notification.constant.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

describe('Notification API', () => {
  let accessToken: string;
  let userId: mongoose.Types.ObjectId;
  let profileId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    userId = new mongoose.Types.ObjectId();
    profileId = new mongoose.Types.ObjectId();

    const hashedPassword = await hashPassword('Password123!');

    await AuthModel.create({
      _id: userId,
      name: 'Test Farmer',
      email: 'notifarmer@example.com',
      password: hashedPassword,
      role: 'farmer',
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
      passwordChangedAt: new Date(),
    });

    await ProfileModel.create({
      _id: profileId,
      userId,
      firstName: 'Test',
      lastName: 'Farmer',
      address: 'Rangpur, Bangladesh',
    });

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'notifarmer@example.com',
      password: 'Password123!',
    });

    expect(loginResponse.status).toBe(200);
    accessToken = loginResponse.body.data.accessToken;
    expect(accessToken).toBeDefined();
  });

  // ============================================================
  // GET /api/v1/notification (Get Notifications)
  // ============================================================

  describe('GET /api/v1/notification', () => {
    it('should return paginated notifications and unread count for user', async () => {
      await NotificationModel.create([
        {
          userId,
          type: NOTIFICATION_TYPE.SYSTEM,
          status: NOTIFICATION_STATUS.UNREAD,
          title: 'System Notice',
          message: 'Welcome to Agri Smart platform.',
        },
        {
          userId,
          type: NOTIFICATION_TYPE.DISEASE_DETECTION,
          status: NOTIFICATION_STATUS.READ,
          title: 'Disease Scan Finished',
          message: 'Your report is ready.',
        },
      ]);

      const response = await request(app)
        .get('/api/v1/notification')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.unreadCount).toBe(1);
    });

    it('should return 401 Unauthorized when request is unauthenticated', async () => {
      const response = await request(app).get('/api/v1/notification');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET /api/v1/notification/:notificationId
  // ============================================================

  describe('GET /api/v1/notification/:notificationId', () => {
    it('should return notification details by ID', async () => {
      const notification = await NotificationModel.create({
        userId,
        type: NOTIFICATION_TYPE.CROP_RECOMMENDATION,
        status: NOTIFICATION_STATUS.UNREAD,
        title: 'Crop Recommendation Ready',
        message: 'Recommendation for Rice is generated.',
      });

      const response = await request(app)
        .get(`/api/v1/notification/${notification._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Crop Recommendation Ready');
    });

    it('should return 404 when notification does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/notification/${nonExistentId.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 Forbidden when accessing notification of another user', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const notification = await NotificationModel.create({
        userId: otherUserId,
        type: NOTIFICATION_TYPE.SYSTEM,
        status: NOTIFICATION_STATUS.UNREAD,
        title: 'Other User Notice',
        message: 'Private message',
      });

      const response = await request(app)
        .get(`/api/v1/notification/${notification._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // PATCH /api/v1/notification/:notificationId/read
  // ============================================================

  describe('PATCH /api/v1/notification/:notificationId/read', () => {
    it('should mark notification as read', async () => {
      const notification = await NotificationModel.create({
        userId,
        type: NOTIFICATION_TYPE.AI,
        status: NOTIFICATION_STATUS.UNREAD,
        title: 'AI Consultation Updated',
        message: 'New response from assistant.',
      });

      const response = await request(app)
        .patch(`/api/v1/notification/${notification._id.toString()}/read`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(NOTIFICATION_STATUS.READ);

      const stored = await NotificationModel.findById(notification._id);
      expect(stored?.status).toBe(NOTIFICATION_STATUS.READ);
    });
  });

  // ============================================================
  // PATCH /api/v1/notification/read-all
  // ============================================================

  describe('PATCH /api/v1/notification/read-all', () => {
    it('should mark all user notifications as read', async () => {
      await NotificationModel.create([
        {
          userId,
          type: NOTIFICATION_TYPE.SYSTEM,
          status: NOTIFICATION_STATUS.UNREAD,
          title: 'Notice 1',
          message: 'Msg 1',
        },
        {
          userId,
          type: NOTIFICATION_TYPE.ACCOUNT,
          status: NOTIFICATION_STATUS.UNREAD,
          title: 'Notice 2',
          message: 'Msg 2',
        },
      ]);

      const response = await request(app)
        .patch('/api/v1/notification/read-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const unreadCount = await NotificationModel.countDocuments({
        userId,
        status: NOTIFICATION_STATUS.UNREAD,
      });

      expect(unreadCount).toBe(0);
    });
  });

  // ============================================================
  // DELETE /api/v1/notification/:notificationId
  // ============================================================

  describe('DELETE /api/v1/notification/:notificationId', () => {
    it('should delete a notification by ID', async () => {
      const notification = await NotificationModel.create({
        userId,
        type: NOTIFICATION_TYPE.SYSTEM,
        status: NOTIFICATION_STATUS.UNREAD,
        title: 'To Be Deleted',
        message: 'Delete me',
      });

      const response = await request(app)
        .delete(`/api/v1/notification/${notification._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const stored = await NotificationModel.findById(notification._id);
      expect(stored).toBeNull();
    });

    it('should return 404 when deleting non-existent notification', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/v1/notification/${nonExistentId.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
