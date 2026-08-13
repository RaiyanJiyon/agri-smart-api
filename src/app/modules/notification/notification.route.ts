import { Router } from 'express';
import { auth } from '../../shared/middleware/auth.js';
import validateRequest from '../../shared/validation/validateRequest.js';
import {
  getNotificationsValidationSchema,
  notificationIdValidationSchema,
} from './notification.validation.js';
import { NotificationController } from './notification.controller.js';

const router = Router();

router.get(
  '/',
  auth(),
  validateRequest(getNotificationsValidationSchema),
  NotificationController.getNotifications
);

router.get(
  '/:notificationId',
  auth(),
  validateRequest(notificationIdValidationSchema),
  NotificationController.getNotificationById
);

router.patch(
  '/:notificationId/read',
  auth(),
  validateRequest(notificationIdValidationSchema),
  NotificationController.markAsRead
);

router.patch('/read-all', auth(), NotificationController.markAllAsRead);

router.delete(
  '/:notificationId',
  auth(),
  validateRequest(notificationIdValidationSchema),
  NotificationController.deleteNotification
);

export const NotificationRoutes = router;
