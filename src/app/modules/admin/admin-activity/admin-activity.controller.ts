import type { Request, Response } from 'express';
import { catchAsync } from '../../../shared/utils/catchAsync.js';
import type { AdminActivityAction } from '../admin.constant.js';
import { getAdminUserObjectId } from '../admin.utils.js';
import { AdminActivityService } from './admin-activity.service.js';
import { sendResponse } from '../../../shared/utils/sendResponse.js';
import { HTTP_STATUS } from '../../../shared/constants/httpStatus.js';
import type { AdminActivityQuery } from './admin-activity.interface.js';
import { getObjectId } from './admin-activity.utils.js';

const getActivities = catchAsync(async (req: Request, res: Response) => {
  const query: AdminActivityQuery = {};

  if (typeof req.query.action === 'string') {
    query.action = req.query.action as AdminActivityAction;
  }

  if (typeof req.query.adminId === 'string') {
    query.adminId = getAdminUserObjectId(req.query.adminId);
  }

  if (typeof req.query.targetUserId === 'string') {
    query.targetUserId = getAdminUserObjectId(req.query.targetUserId);
  }

  if (typeof req.query.page === 'string') {
    const parsedPage = Number(req.query.page);
    if (!isNaN(parsedPage)) {
      query.page = parsedPage;
    }
  }

  if (typeof req.query.limit === 'string') {
    const parsedLimit = Number(req.query.limit);
    if (!isNaN(parsedLimit)) {
      query.limit = parsedLimit;
    }
  }

  const activities = await AdminActivityService.get(query);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Admin activities retrieved successfully.',
    data: activities,
  });
});

const getActivityById = catchAsync(async (req: Request, res: Response) => {
  const activityId = req.params.activityId as string;

  const activity = await AdminActivityService.getById(getObjectId(activityId));

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Admin activity retrieved successfully.',
    data: activity,
  });
});

export const AdminActivityController = {
  getActivities,
  getActivityById,
};
