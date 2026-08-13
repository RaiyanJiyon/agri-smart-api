import { Router } from 'express';
import { auth } from '../../../shared/middleware/auth.js';
import { USER_ROLE } from '../../auth/auth.constant.js';
import validateRequest from '../../../shared/validation/validateRequest.js';
import { getAdminActivityValidationSchema } from './admin-activity.validation.js';
import { AdminActivityController } from './admin-activity.controller.js';

const router = Router();

router.get(
  '/',
  auth(USER_ROLE.ADMIN),
  validateRequest(getAdminActivityValidationSchema),
  AdminActivityController.getActivities
);

export const AdminActivityRoutes = router;
