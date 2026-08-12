import type { Request, Response } from 'express';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import type { UserRole, UserStatus } from '../auth/auth.interface.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { AdminService } from './admin.service.js';
import { sendResponse } from '../../shared/utils/sendResponse.js';
import type { AdminUserQuery } from './admin.interface.js';
import { getAdminUserObjectId } from './admin.utils.js';

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

  const result = await AdminService.getUsers(query);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Users retrieved successfully.',
    data: result,
  });
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;

  const user = await AdminService.getUser(getAdminUserObjectId(userId));

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

  const updatedUser = await AdminService.updateUserStatus(getAdminUserObjectId(userId), status);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'User status updated successfully.',
    data: updatedUser,
  });
});

export const AdminController = {
  getUsers,
  getUser,
  updateUserStatus,
};
