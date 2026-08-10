import type { Request, Response } from 'express';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { DashboardService } from './dashboard.service.js';
import { Types } from 'mongoose';
import { sendResponse } from '../../shared/utils/index.js';

const getMyDashboard = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
  }

  const data = await DashboardService.getMyDashboard(new Types.ObjectId(userId));

  sendResponse(res, {
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: 'Dashboard retrieved successfully.',
    data,
  });
});

export const DashboardController = {
  getMyDashboard,
};
