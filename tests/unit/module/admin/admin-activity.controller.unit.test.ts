import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

vi.mock('../../../../src/app/modules/admin/admin-activity/admin-activity.service.js', () => ({
  AdminActivityService: {
    get: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('../../../../src/app/shared/utils/sendResponse.js', () => ({
  sendResponse: vi.fn((res: Response, data: unknown) => {
    res.status(200).json(data);
  }),
}));

import { AdminActivityController } from '../../../../src/app/modules/admin/admin-activity/admin-activity.controller.js';
import { AdminActivityService } from '../../../../src/app/modules/admin/admin-activity/admin-activity.service.js';
import { sendResponse } from '../../../../src/app/shared/utils/sendResponse.js';

type AsyncHandler = (req: Request, res: Response, next: ReturnType<typeof vi.fn>) => Promise<void>;

describe('AdminActivityController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: ReturnType<typeof vi.fn>;

  const adminIdStr = new mongoose.Types.ObjectId().toString();
  const targetUserIdStr = new mongoose.Types.ObjectId().toString();
  const activityIdStr = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFn = vi.fn();
    vi.clearAllMocks();
  });

  describe('getActivities', () => {
    it('should retrieve activities with empty query parameters', async () => {
      mockReq.query = {};
      const mockActivities = [{ _id: 'act1', action: 'USER_BAN' }];
      vi.mocked(AdminActivityService.get).mockResolvedValueOnce(mockActivities as never);

      const getActivities = AdminActivityController.getActivities as unknown as AsyncHandler;
      await getActivities(mockReq as Request, mockRes as Response, nextFn);

      expect(AdminActivityService.get).toHaveBeenCalledWith({});
      expect(sendResponse).toHaveBeenCalledWith(mockRes, {
        statusCode: 200,
        success: true,
        message: 'Admin activities retrieved successfully.',
        data: mockActivities,
      });
    });

    it('should retrieve activities with valid query parameters (action, adminId, targetUserId, page, limit)', async () => {
      mockReq.query = {
        action: 'USER_BAN',
        adminId: adminIdStr,
        targetUserId: targetUserIdStr,
        page: '2',
        limit: '15',
      };
      const mockActivities = [{ _id: 'act2', action: 'USER_BAN' }];
      vi.mocked(AdminActivityService.get).mockResolvedValueOnce(mockActivities as never);

      const getActivities = AdminActivityController.getActivities as unknown as AsyncHandler;
      await getActivities(mockReq as Request, mockRes as Response, nextFn);

      expect(AdminActivityService.get).toHaveBeenCalledWith({
        action: 'USER_BAN',
        adminId: new mongoose.Types.ObjectId(adminIdStr),
        targetUserId: new mongoose.Types.ObjectId(targetUserIdStr),
        page: 2,
        limit: 15,
      });
      expect(sendResponse).toHaveBeenCalledWith(mockRes, {
        statusCode: 200,
        success: true,
        message: 'Admin activities retrieved successfully.',
        data: mockActivities,
      });
    });

    it('should ignore non-numeric string values for page and limit', async () => {
      mockReq.query = {
        page: 'invalid-page',
        limit: 'invalid-limit',
      };
      const mockActivities: unknown[] = [];
      vi.mocked(AdminActivityService.get).mockResolvedValueOnce(mockActivities as never);

      const getActivities = AdminActivityController.getActivities as unknown as AsyncHandler;
      await getActivities(mockReq as Request, mockRes as Response, nextFn);

      expect(AdminActivityService.get).toHaveBeenCalledWith({});
      expect(sendResponse).toHaveBeenCalledWith(mockRes, {
        statusCode: 200,
        success: true,
        message: 'Admin activities retrieved successfully.',
        data: mockActivities,
      });
    });
  });

  describe('getActivityById', () => {
    it('should retrieve a single activity by activityId', async () => {
      mockReq.params = { activityId: activityIdStr };
      const mockActivity = { _id: activityIdStr, action: 'USER_UNBAN' };
      vi.mocked(AdminActivityService.getById).mockResolvedValueOnce(mockActivity as never);

      const getActivityById = AdminActivityController.getActivityById as unknown as AsyncHandler;
      await getActivityById(mockReq as Request, mockRes as Response, nextFn);

      expect(AdminActivityService.getById).toHaveBeenCalledWith(
        new mongoose.Types.ObjectId(activityIdStr)
      );
      expect(sendResponse).toHaveBeenCalledWith(mockRes, {
        statusCode: 200,
        success: true,
        message: 'Admin activity retrieved successfully.',
        data: mockActivity,
      });
    });

    it('should pass ApiError to next when activityId is an invalid ObjectId', async () => {
      mockReq.params = { activityId: 'invalid-activity-id' };

      const getActivityById = AdminActivityController.getActivityById as unknown as AsyncHandler;
      await getActivityById(mockReq as Request, mockRes as Response, nextFn);

      expect(nextFn).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Invalid ObjectId.',
        })
      );
    });
  });
});
