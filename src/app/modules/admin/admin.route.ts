import { Router } from 'express';
import { auth } from '../../shared/middleware/auth.js';
import { USER_ROLE } from '../auth/auth.constant.js';
import validateRequest from '../../shared/validation/validateRequest.js';
import {
  getUsersValidationSchema,
  getUserValidationSchema,
  updateUserStatusValidationSchema,
} from './admin.validation.js';
import { AdminController } from './admin.controller.js';
import { AdminActivityRoutes } from './admin-activity/admin-activity.route.js';

const router = Router();

router.get('/dashboard/statistics', auth(USER_ROLE.ADMIN), AdminController.getDashboardStatistics);

router.get('/ai-usage/statistics', auth(USER_ROLE.ADMIN), AdminController.getAIUsageStatistics);

router.get(
  '/users',
  auth(USER_ROLE.ADMIN),
  validateRequest(getUsersValidationSchema),
  AdminController.getUsers
);

router.get(
  '/users/:userId',
  auth(USER_ROLE.ADMIN),
  validateRequest(getUserValidationSchema),
  AdminController.getUser
);

router.patch(
  '/users/:userId/status',
  auth(USER_ROLE.ADMIN),
  validateRequest(updateUserStatusValidationSchema),
  AdminController.updateUserStatus
);

router.use('/activity', AdminActivityRoutes);

export const AdminRoutes = router;
