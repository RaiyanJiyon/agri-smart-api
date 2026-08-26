import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminService } from '../../../../src/app/modules/admin/admin.service.js';
import { AdminRepository } from '../../../../src/app/modules/admin/admin.repository.js';
import { AdminActivityService } from '../../../../src/app/modules/admin/admin-activity/admin-activity.service.js';
import { AIUsageService } from '../../../../src/app/shared/ai/ai-usage.service.js';
import type { AIUsageStatistics } from '../../../../src/app/shared/ai/ai-usage.interface.js';
import { USER_ROLE, USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import { ADMIN_ACTIVITY_ACTION } from '../../../../src/app/modules/admin/admin.constant.js';
import { createMockUser } from '../../../fixtures/index.js';
import type { AdminAuditContext } from '../../../../src/app/modules/admin/admin.utils.js';

vi.mock('../../../../src/app/modules/admin/admin.repository.js', () => ({
  AdminRepository: {
    findUsers: vi.fn(),
    findUserById: vi.fn(),
    updateUserStatus: vi.fn(),
    getDashboardStatistics: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/admin/admin-activity/admin-activity.service.js', () => ({
  AdminActivityService: {
    record: vi.fn(),
    getStatusChangeAction: vi.fn(),
  },
}));

vi.mock('../../../../src/app/shared/ai/ai-usage.service.js', () => ({
  AIUsageService: {
    getStatistics: vi.fn(),
  },
}));

describe('AdminService', () => {
  const adminId = new mongoose.Types.ObjectId();
  const auditContext: AdminAuditContext = {
    adminId,
    ipAddress: '127.0.0.1',
    userAgent: 'vitest-agent',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return users list and record VIEW_USERS audit activity', async () => {
      const mockResult = {
        users: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      vi.mocked(AdminRepository.findUsers).mockResolvedValue(mockResult);

      const query = { page: 1, limit: 20 };
      const result = await AdminService.getUsers(query, auditContext);

      expect(result).toEqual(mockResult);
      expect(AdminRepository.findUsers).toHaveBeenCalledWith(query);
      expect(AdminActivityService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId,
          action: ADMIN_ACTIVITY_ACTION.VIEW_USERS,
        })
      );
    });
  });

  describe('getUser', () => {
    it('should return user details and record VIEW_USER audit activity', async () => {
      const userId = new mongoose.Types.ObjectId();
      const mockUser = createMockUser({ _id: userId });

      vi.mocked(AdminRepository.findUserById).mockResolvedValue(mockUser);

      const result = await AdminService.getUser(userId, auditContext);

      expect(result).toEqual(mockUser);
      expect(AdminRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(AdminActivityService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId,
          action: ADMIN_ACTIVITY_ACTION.VIEW_USER,
          targetUserId: userId,
        })
      );
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();

      vi.mocked(AdminRepository.findUserById).mockResolvedValue(null);

      await expect(AdminService.getUser(userId, auditContext)).rejects.toMatchObject({
        statusCode: 404,
        message: 'User not found.',
      });

      expect(AdminActivityService.record).not.toHaveBeenCalled();
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully and record audit log', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farmer = createMockUser({
        _id: userId,
        role: USER_ROLE.FARMER,
        status: USER_STATUS.ACTIVE,
      });
      const updatedFarmer = { ...farmer, status: USER_STATUS.BLOCKED };

      vi.mocked(AdminRepository.findUserById).mockResolvedValue(farmer);
      vi.mocked(AdminRepository.updateUserStatus).mockResolvedValue(updatedFarmer);
      vi.mocked(AdminActivityService.getStatusChangeAction).mockReturnValue(
        ADMIN_ACTIVITY_ACTION.BLOCK_USER
      );

      const result = await AdminService.updateUserStatus(
        userId,
        USER_STATUS.BLOCKED,
        auditContext
      );

      expect(result.status).toBe(USER_STATUS.BLOCKED);
      expect(AdminRepository.updateUserStatus).toHaveBeenCalledWith(userId, USER_STATUS.BLOCKED);
      expect(AdminActivityService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId,
          action: ADMIN_ACTIVITY_ACTION.BLOCK_USER,
          targetUserId: userId,
        })
      );
    });

    it('should throw NOT_FOUND when target user does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();

      vi.mocked(AdminRepository.findUserById).mockResolvedValue(null);

      await expect(
        AdminService.updateUserStatus(userId, USER_STATUS.BLOCKED, auditContext)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'User not found.',
      });
    });

    it('should throw FORBIDDEN when attempting to modify an admin account', async () => {
      const targetAdminId = new mongoose.Types.ObjectId();
      const targetAdmin = createMockUser({
        _id: targetAdminId,
        role: USER_ROLE.ADMIN,
        status: USER_STATUS.ACTIVE,
      });

      vi.mocked(AdminRepository.findUserById).mockResolvedValue(targetAdmin);

      await expect(
        AdminService.updateUserStatus(targetAdminId, USER_STATUS.BLOCKED, auditContext)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'Administrator accounts cannot be modified through user management.',
      });

      expect(AdminRepository.updateUserStatus).not.toHaveBeenCalled();
    });

    it('should throw BAD_REQUEST when user already has the requested status', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farmer = createMockUser({
        _id: userId,
        role: USER_ROLE.FARMER,
        status: USER_STATUS.ACTIVE,
      });

      vi.mocked(AdminRepository.findUserById).mockResolvedValue(farmer);

      await expect(
        AdminService.updateUserStatus(userId, USER_STATUS.ACTIVE, auditContext)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'User is already active.',
      });

      expect(AdminRepository.updateUserStatus).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if repository updateUserStatus returns null', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farmer = createMockUser({
        _id: userId,
        role: USER_ROLE.FARMER,
        status: USER_STATUS.ACTIVE,
      });

      vi.mocked(AdminRepository.findUserById).mockResolvedValue(farmer);
      vi.mocked(AdminRepository.updateUserStatus).mockResolvedValue(null);

      await expect(
        AdminService.updateUserStatus(userId, USER_STATUS.BLOCKED, auditContext)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'User not found.',
      });
    });
  });

  describe('getDashboardStatistics', () => {
    it('should return dashboard statistics and record audit log', async () => {
      const mockStats = {
        totalUsers: 10,
        activeUsers: 8,
        totalCropRecommendations: 15,
        totalDiseaseAnalyses: 5,
        totalAiRequests: 20,
      };

      vi.mocked(AdminRepository.getDashboardStatistics).mockResolvedValue(mockStats);

      const result = await AdminService.getDashboardStatistics(auditContext);

      expect(result).toEqual(mockStats);
      expect(AdminActivityService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId,
          action: ADMIN_ACTIVITY_ACTION.VIEW_DASHBOARD_STATISTICS,
        })
      );
    });
  });

  describe('getAIUsageStatistics', () => {
    it('should return AI usage statistics and record audit log', async () => {
      const mockStats = {
        totalRequests: 50,
        totalTokens: 10000,
        providers: {},
      };

      vi.mocked(AIUsageService.getStatistics).mockResolvedValue(
        mockStats as unknown as AIUsageStatistics
      );

      const result = await AdminService.getAIUsageStatistics(auditContext);

      expect(result).toEqual(mockStats);
      expect(AdminActivityService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId,
          action: ADMIN_ACTIVITY_ACTION.VIEW_AI_USAGE_STATISTICS,
        })
      );
    });
  });
});
