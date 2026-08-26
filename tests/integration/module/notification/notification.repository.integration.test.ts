import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { NotificationRepository } from '../../../../src/app/modules/notification/notification.repository.js';
import { NotificationModel } from '../../../../src/app/modules/notification/notification.model.js';
import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
} from '../../../../src/app/modules/notification/notification.constant.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';
import type { Notification } from '../../../../src/app/modules/notification/notification.interface.js';

describe('NotificationRepository integration', () => {
  let userId: mongoose.Types.ObjectId;
  let anotherUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    userId = new mongoose.Types.ObjectId();
    anotherUserId = new mongoose.Types.ObjectId();
  });

  describe('create', () => {
    it('should create a notification document in MongoDB', async () => {
      const payload: Notification = {
        userId,
        type: NOTIFICATION_TYPE.SYSTEM,
        status: NOTIFICATION_STATUS.UNREAD,
        title: 'Welcome to Agri Smart',
        message: 'Your account setup is complete.',
        metadata: { feature: 'onboarding' },
      };

      const result = (await NotificationRepository.create(payload)) as Notification & {
        _id: mongoose.Types.ObjectId;
      };

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.userId.toString()).toBe(userId.toString());
      expect(result.title).toBe('Welcome to Agri Smart');
      expect(result.status).toBe(NOTIFICATION_STATUS.UNREAD);

      const stored = await NotificationModel.findById(result._id);
      expect(stored).not.toBeNull();
      expect(stored?.title).toBe('Welcome to Agri Smart');
    });
  });

  describe('findByUserId', () => {
    it('should return user notifications sorted by createdAt descending with pagination', async () => {
      await NotificationModel.create([
        {
          userId,
          type: NOTIFICATION_TYPE.SYSTEM,
          status: NOTIFICATION_STATUS.UNREAD,
          title: 'Notification 1',
          message: 'First notification',
          createdAt: new Date(Date.now() - 5000),
        },
        {
          userId,
          type: NOTIFICATION_TYPE.AI,
          status: NOTIFICATION_STATUS.UNREAD,
          title: 'Notification 2',
          message: 'Second notification',
          createdAt: new Date(Date.now() - 2000),
        },
      ]);

      const results = (await NotificationRepository.findByUserId(
        userId,
        10,
        0
      )) as (Notification & { _id: mongoose.Types.ObjectId })[];

      expect(results).toHaveLength(2);
      expect(results[0]?.title).toBe('Notification 2');
      expect(results[1]?.title).toBe('Notification 1');
    });
  });

  describe('countByUserId and countUnreadByUserId', () => {
    it('should count total and unread notifications accurately for a user', async () => {
      await NotificationModel.create([
        {
          userId,
          type: NOTIFICATION_TYPE.SYSTEM,
          status: NOTIFICATION_STATUS.UNREAD,
          title: 'Unread 1',
          message: 'Msg',
        },
        {
          userId,
          type: NOTIFICATION_TYPE.ACCOUNT,
          status: NOTIFICATION_STATUS.READ,
          title: 'Read 1',
          message: 'Msg',
        },
        {
          userId: anotherUserId,
          type: NOTIFICATION_TYPE.SYSTEM,
          status: NOTIFICATION_STATUS.UNREAD,
          title: 'Other Unread',
          message: 'Msg',
        },
      ]);

      const total = await NotificationRepository.countByUserId(userId);
      const unread = await NotificationRepository.countUnreadByUserId(userId);

      expect(total).toBe(2);
      expect(unread).toBe(1);
    });
  });

  describe('markAsRead and markAllAsRead', () => {
    it('should mark a specific notification as read', async () => {
      const created = await NotificationModel.create({
        userId,
        type: NOTIFICATION_TYPE.DISEASE_DETECTION,
        status: NOTIFICATION_STATUS.UNREAD,
        title: 'Disease Detected',
        message: 'Tomato late blight detected.',
      });

      const updated = await NotificationRepository.markAsRead(created._id);

      expect(updated).not.toBeNull();
      expect(updated?.status).toBe(NOTIFICATION_STATUS.READ);
    });

    it('should mark all unread notifications for a user as read', async () => {
      await NotificationModel.create([
        {
          userId,
          type: NOTIFICATION_TYPE.SYSTEM,
          status: NOTIFICATION_STATUS.UNREAD,
          title: 'Unread 1',
          message: 'Msg',
        },
        {
          userId,
          type: NOTIFICATION_TYPE.CROP_RECOMMENDATION,
          status: NOTIFICATION_STATUS.UNREAD,
          title: 'Unread 2',
          message: 'Msg',
        },
      ]);

      await NotificationRepository.markAllAsRead(userId);

      const unreadCount = await NotificationRepository.countUnreadByUserId(userId);
      expect(unreadCount).toBe(0);
    });
  });

  describe('deleteById', () => {
    it('should delete a notification document by ID', async () => {
      const created = await NotificationModel.create({
        userId,
        type: NOTIFICATION_TYPE.SYSTEM,
        status: NOTIFICATION_STATUS.UNREAD,
        title: 'To Delete',
        message: 'Will be removed',
      });

      const deleted = await NotificationRepository.deleteById(created._id);

      expect(deleted).not.toBeNull();
      const stored = await NotificationModel.findById(created._id);
      expect(stored).toBeNull();
    });
  });
});
