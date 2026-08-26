import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminActivityService } from '../../../../src/app/modules/admin/admin-activity/admin-activity.service.js';
import { AdminActivityRepository } from '../../../../src/app/modules/admin/admin-activity/admin-activity.repository.js';
import type {
  AdminActivityListResult,
  AdminActivityPopulated,
} from '../../../../src/app/modules/admin/admin-activity/admin-activity.interface.js';
import { ADMIN_ACTIVITY_ACTION } from '../../../../src/app/modules/admin/admin.constant.js';
import { USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import {
  createMockAdminActivity,
  createMockAdminActivityList,
} from '../../../fixtures/index.js';

vi.mock(
  '../../../../src/app/modules/admin/admin-activity/admin-activity.repository.js',
  () => ({
    AdminActivityRepository: {
      create: vi.fn(),
      findRecent: vi.fn(),
      findByAdminId: vi.fn(),
      findByTargetUserId: vi.fn(),
      find: vi.fn(),
      findById: vi.fn(),
    },
  })
);

describe('AdminActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('record', () => {
    it('should create and return an admin activity record', async () => {
      const activity = createMockAdminActivity();

      vi.mocked(AdminActivityRepository.create).mockResolvedValue(activity);

      const result = await AdminActivityService.record(activity);

      expect(result).toEqual(activity);
      expect(AdminActivityRepository.create).toHaveBeenCalledWith(activity);
    });
  });

  describe('getRecent', () => {
    it('should return recent activities limited by count', async () => {
      const activities = createMockAdminActivityList(3);

      vi.mocked(AdminActivityRepository.findRecent).mockResolvedValue(activities);

      const result = await AdminActivityService.getRecent(5);

      expect(result).toEqual(activities);
      expect(AdminActivityRepository.findRecent).toHaveBeenCalledWith(5);
    });
  });

  describe('getByAdminId', () => {
    it('should return activities for specific admin', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const activities = createMockAdminActivityList(2, { adminId });

      vi.mocked(AdminActivityRepository.findByAdminId).mockResolvedValue(activities);

      const result = await AdminActivityService.getByAdminId(adminId);

      expect(result).toEqual(activities);
      expect(AdminActivityRepository.findByAdminId).toHaveBeenCalledWith(adminId);
    });
  });

  describe('getByTargetUserId', () => {
    it('should return activities targeting specific user', async () => {
      const targetUserId = new mongoose.Types.ObjectId();
      const activities = createMockAdminActivityList(2, { targetUserId });

      vi.mocked(AdminActivityRepository.findByTargetUserId).mockResolvedValue(activities);

      const result = await AdminActivityService.getByTargetUserId(targetUserId);

      expect(result).toEqual(activities);
      expect(AdminActivityRepository.findByTargetUserId).toHaveBeenCalledWith(targetUserId);
    });
  });

  describe('get', () => {
    it('should return paginated admin activity results', async () => {
      const mockResult: AdminActivityListResult = {
        activities: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };

      vi.mocked(AdminActivityRepository.find).mockResolvedValue(mockResult);

      const query = { page: 1, limit: 50 };
      const result = await AdminActivityService.get(query);

      expect(result).toEqual(mockResult);
      expect(AdminActivityRepository.find).toHaveBeenCalledWith(query);
    });
  });

  describe('getById', () => {
    it('should return populated activity when found', async () => {
      const activityId = new mongoose.Types.ObjectId();
      const activity = createMockAdminActivity({ _id: activityId });

      vi.mocked(AdminActivityRepository.findById).mockResolvedValue(
        activity as unknown as AdminActivityPopulated
      );

      const result = await AdminActivityService.getById(activityId);

      expect(result).toEqual(activity);
      expect(AdminActivityRepository.findById).toHaveBeenCalledWith(activityId);
    });

    it('should throw NOT_FOUND when activity does not exist', async () => {
      const activityId = new mongoose.Types.ObjectId();

      vi.mocked(AdminActivityRepository.findById).mockResolvedValue(null);

      await expect(AdminActivityService.getById(activityId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Admin activity not found.',
      });
    });
  });

  describe('getStatusChangeAction', () => {
    it('should return ACTIVATE_USER when changing from INACTIVE to ACTIVE', () => {
      const action = AdminActivityService.getStatusChangeAction(
        USER_STATUS.INACTIVE,
        USER_STATUS.ACTIVE
      );
      expect(action).toBe(ADMIN_ACTIVITY_ACTION.ACTIVATE_USER);
    });

    it('should return UNBLOCK_USER when changing from BLOCKED to ACTIVE', () => {
      const action = AdminActivityService.getStatusChangeAction(
        USER_STATUS.BLOCKED,
        USER_STATUS.ACTIVE
      );
      expect(action).toBe(ADMIN_ACTIVITY_ACTION.UNBLOCK_USER);
    });

    it('should return DEACTIVATE_USER when new status is INACTIVE', () => {
      const action = AdminActivityService.getStatusChangeAction(
        USER_STATUS.ACTIVE,
        USER_STATUS.INACTIVE
      );
      expect(action).toBe(ADMIN_ACTIVITY_ACTION.DEACTIVATE_USER);
    });

    it('should return BLOCK_USER when new status is BLOCKED', () => {
      const action = AdminActivityService.getStatusChangeAction(
        USER_STATUS.ACTIVE,
        USER_STATUS.BLOCKED
      );
      expect(action).toBe(ADMIN_ACTIVITY_ACTION.BLOCK_USER);
    });
  });
});
