import type { Request, Response } from 'express';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { getUserObjectId } from '../../shared/utils/request.utils.js';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service.js';
import { sendResponse } from '../../shared/utils/sendResponse.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserObjectId(req);

  const page = typeof req.query.page === 'string' ? Number(req.query.page) : undefined;

  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

  const result = await NotificationService.getByUserId(userId, page, limit);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Notifications retrieved successfully.',
    data: result,
  });
});

const getNotificationById = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserObjectId(req);
  const notificationId = new Types.ObjectId(req.params.notificationId as string);

  const notification = await NotificationService.getById(notificationId, userId);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Notification retrieved successfully.',
    data: notification,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserObjectId(req);
  const notificationId = new Types.ObjectId(req.params.notificationId as string);

  const updatedNotification = await NotificationService.markAsRead(notificationId, userId);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Notification marked as read successfully.',
    data: updatedNotification,
  });
});

const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserObjectId(req);

  await NotificationService.markAllAsRead(userId);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'All notifications marked as read successfully.',
    data: null,
  });
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserObjectId(req);

  const notificationId = new Types.ObjectId(req.params.notificationId as string);

  await NotificationService.deleteNotification(notificationId, userId);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Notification deleted successfully.',
    data: null,
  });
});

export const NotificationController = {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
