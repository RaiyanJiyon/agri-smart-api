import type { Request, Response } from 'express';
import { catchAsync, sendResponse } from '../../shared/utils/index.js';
import type { UserRole, UserStatus } from '../auth/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { AdminService } from './admin.service.js';
import type { AdminUserQuery } from './admin.interface.js';
import { getAdminUserObjectId, getAuditContext } from './admin.utils.js';

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const query: AdminUserQuery = {};

  if (typeof req.query.search === 'string') {
    query.search = req.query.search;
  }
  if (typeof req.query.role === 'string') {
    query.role = req.query.role as UserRole;
  }
  if (typeof req.query.status === 'string') {
    query.status = req.query.status as UserStatus;
  }
  if (req.query.page) {
    query.page = Number(req.query.page);
  }
  if (req.query.limit) {
    query.limit = Number(req.query.limit);
  }

  const result = await AdminService.getUsers(query, getAuditContext(req));

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Users retrieved successfully.',
    data: result,
  });
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;

  const user = await AdminService.getUser(getAdminUserObjectId(userId), getAuditContext(req));

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'User retrieved successfully.',
    data: user,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId as string;
  const { status } = req.body as { status: UserStatus };

  const updatedUser = await AdminService.updateUserStatus(
    getAdminUserObjectId(userId),
    status,
    getAuditContext(req)
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'User status updated successfully.',
    data: updatedUser,
  });
});

const getDashboardStatistics = catchAsync(async (req: Request, res: Response) => {
  const statistics = await AdminService.getDashboardStatistics(getAuditContext(req));

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Dashboard statistics retrieved successfully.',
    data: statistics,
  });
});

const getAIUsageStatistics = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAIUsageStatistics(getAuditContext(req));

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'AI usage statistics retrieved successfully.',
    data: result,
  });
});

export const AdminController = {
  getUsers,
  getUser,
  updateUserStatus,
  getDashboardStatistics,
  getAIUsageStatistics,
};
