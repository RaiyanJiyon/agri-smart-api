import { Router } from 'express';
import { auth, adminRateLimiter } from '../../shared/middleware/index.js';
import { USER_ROLE } from '../auth/index.js';
import { validateRequest } from '../../shared/validation/index.js';
import {
  getUsersValidationSchema,
  getUserValidationSchema,
  updateUserStatusValidationSchema,
} from './admin.validation.js';
import { AdminController } from './admin.controller.js';
import { AdminActivityRoutes } from './admin-activity/admin-activity.route.js';

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
