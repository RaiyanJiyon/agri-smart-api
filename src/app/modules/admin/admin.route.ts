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
import { adminRateLimiter } from '../../shared/middleware/rateLimiter.js';

const router = Router();

// Apply Admin Auth & Admin Rate Limiter globally across all admin routes
router.use(auth(USER_ROLE.ADMIN), adminRateLimiter);

router.get('/dashboard/statistics', AdminController.getDashboardStatistics);

router.get('/ai-usage/statistics', AdminController.getAIUsageStatistics);

router.get('/users', validateRequest(getUsersValidationSchema), AdminController.getUsers);

router.get('/users/:userId', validateRequest(getUserValidationSchema), AdminController.getUser);

router.patch(
  '/users/:userId/status',
  validateRequest(updateUserStatusValidationSchema),
  AdminController.updateUserStatus
);

router.use('/activity', AdminActivityRoutes);

export const AdminRoutes = router;
