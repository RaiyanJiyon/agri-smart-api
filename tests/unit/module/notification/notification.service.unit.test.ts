import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationService } from '../../../../src/app/modules/notification/notification.service.js';
import { NotificationRepository } from '../../../../src/app/modules/notification/notification.repository.js';
import {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
} from '../../../../src/app/modules/notification/notification.constant.js';
import { createMockNotification, createMockNotificationList } from '../../../fixtures/index.js';

vi.mock('../../../../src/app/modules/notification/notification.repository.js', () => ({
  NotificationRepository: {
    create: vi.fn(),
    findByUserId: vi.fn(),
    countByUserId: vi.fn(),
    countUnreadByUserId: vi.fn(),
    findById: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteById: vi.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a notification', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notification = createMockNotification({ userId });

      vi.mocked(NotificationRepository.create).mockResolvedValue(notification);

      const result = await NotificationService.create(notification);

      expect(result).toEqual(notification);
      expect(NotificationRepository.create).toHaveBeenCalledWith(notification);
    });
  });

  describe('getByUserId', () => {
    it('should return paginated notifications with unread count', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notifications = createMockNotificationList(3, { userId });

      vi.mocked(NotificationRepository.findByUserId).mockResolvedValue(notifications);
      vi.mocked(NotificationRepository.countByUserId).mockResolvedValue(3);
      vi.mocked(NotificationRepository.countUnreadByUserId).mockResolvedValue(2);

      const result = await NotificationService.getByUserId(userId, 1, 20);

      expect(result.notifications).toEqual(notifications);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
      });
      expect(result.unreadCount).toBe(2);

      expect(NotificationRepository.findByUserId).toHaveBeenCalledWith(userId, 20, 0);
      expect(NotificationRepository.countByUserId).toHaveBeenCalledWith(userId);
      expect(NotificationRepository.countUnreadByUserId).toHaveBeenCalledWith(userId);
    });

    it('should compute correct skip offset for page 2', async () => {
      const userId = new mongoose.Types.ObjectId();

      vi.mocked(NotificationRepository.findByUserId).mockResolvedValue([]);
      vi.mocked(NotificationRepository.countByUserId).mockResolvedValue(25);
      vi.mocked(NotificationRepository.countUnreadByUserId).mockResolvedValue(0);

      const result = await NotificationService.getByUserId(userId, 2, 10);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      // skip = (2-1) * 10 = 10
      expect(NotificationRepository.findByUserId).toHaveBeenCalledWith(userId, 10, 10);
    });
  });

  describe('getById', () => {
    it('should return notification when found and owned by user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = createMockNotification({ _id: notificationId, userId });

      vi.mocked(NotificationRepository.findById).mockResolvedValue(notification);

      const result = await NotificationService.getById(notificationId, userId);

      expect(result).toEqual(notification);
      expect(NotificationRepository.findById).toHaveBeenCalledWith(notificationId);
    });

    it('should throw NOT_FOUND when notification does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();

      vi.mocked(NotificationRepository.findById).mockResolvedValue(null);

      await expect(NotificationService.getById(notificationId, userId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Notification not found.',
      });
    });

    it('should throw FORBIDDEN when notification belongs to another user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = createMockNotification({ _id: notificationId, userId: otherUserId });

      vi.mocked(NotificationRepository.findById).mockResolvedValue(notification);

      await expect(NotificationService.getById(notificationId, userId)).rejects.toMatchObject({
        statusCode: 403,
        message: 'You are not allowed to access this notification.',
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark an unread notification as read', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const unread = createMockNotification({
        _id: notificationId,
        userId,
        status: NOTIFICATION_STATUS.UNREAD,
      });
      const readNotification = createMockNotification({
        _id: notificationId,
        userId,
        status: NOTIFICATION_STATUS.READ,
      });

      vi.mocked(NotificationRepository.findById).mockResolvedValue(unread);
      vi.mocked(NotificationRepository.markAsRead).mockResolvedValue(readNotification);

      const result = await NotificationService.markAsRead(notificationId, userId);

      expect(result.status).toBe(NOTIFICATION_STATUS.READ);
      expect(NotificationRepository.markAsRead).toHaveBeenCalledWith(notificationId);
    });

    it('should return notification without DB update when already read', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const alreadyRead = createMockNotification({
        _id: notificationId,
        userId,
        status: NOTIFICATION_STATUS.READ,
      });

      vi.mocked(NotificationRepository.findById).mockResolvedValue(alreadyRead);

      const result = await NotificationService.markAsRead(notificationId, userId);

      expect(result.status).toBe(NOTIFICATION_STATUS.READ);
      expect(NotificationRepository.markAsRead).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when marking another user notification as read', async () => {
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = createMockNotification({ _id: notificationId, userId: otherUserId });

      vi.mocked(NotificationRepository.findById).mockResolvedValue(notification);

      await expect(NotificationService.markAsRead(notificationId, userId)).rejects.toMatchObject({
        statusCode: 403,
      });

      expect(NotificationRepository.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for the user', async () => {
      const userId = new mongoose.Types.ObjectId();

      vi.mocked(NotificationRepository.markAllAsRead).mockResolvedValue(undefined);

      await NotificationService.markAllAsRead(userId);

      expect(NotificationRepository.markAllAsRead).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteNotification', () => {
    it('should delete and return notification when owned by user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = createMockNotification({ _id: notificationId, userId });

      vi.mocked(NotificationRepository.findById).mockResolvedValue(notification);
      vi.mocked(NotificationRepository.deleteById).mockResolvedValue(notification);

      const result = await NotificationService.deleteNotification(notificationId, userId);

      expect(result).toEqual(notification);
      expect(NotificationRepository.deleteById).toHaveBeenCalledWith(notificationId);
    });

    it('should throw NOT_FOUND when deleting a non-existent notification', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();

      vi.mocked(NotificationRepository.findById).mockResolvedValue(null);

      await expect(
        NotificationService.deleteNotification(notificationId, userId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Notification not found.',
      });

      expect(NotificationRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when deleting another user notification', async () => {
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = createMockNotification({ _id: notificationId, userId: otherUserId });

      vi.mocked(NotificationRepository.findById).mockResolvedValue(notification);

      await expect(
        NotificationService.deleteNotification(notificationId, userId)
      ).rejects.toMatchObject({
        statusCode: 403,
      });

      expect(NotificationRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should cover the secondary NOT_FOUND branch when deleteById returns null', async () => {
      const userId = new mongoose.Types.ObjectId();
      const notificationId = new mongoose.Types.ObjectId();
      const notification = createMockNotification({ _id: notificationId, userId });

      vi.mocked(NotificationRepository.findById).mockResolvedValue(notification);
      vi.mocked(NotificationRepository.deleteById).mockResolvedValue(null);

      await expect(
        NotificationService.deleteNotification(notificationId, userId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Notification not found.',
      });
    });
  });

  describe('notification types', () => {
    it.each([
      NOTIFICATION_TYPE.SYSTEM,
      NOTIFICATION_TYPE.ACCOUNT,
      NOTIFICATION_TYPE.AI,
      NOTIFICATION_TYPE.DISEASE_DETECTION,
      NOTIFICATION_TYPE.CROP_RECOMMENDATION,
    ])('should create notification of type %s', async (type) => {
      const userId = new mongoose.Types.ObjectId();
      const notification = createMockNotification({ userId, type });

      vi.mocked(NotificationRepository.create).mockResolvedValue(notification);

      const result = await NotificationService.create(notification);

      expect(result.type).toBe(type);
    });
  });
});
