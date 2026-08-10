import { Router } from 'express';
import { auth } from '../../shared/middleware/auth.js';
import { DashboardController } from './dashboard.controller.js';

const router = Router();

router.get('/', auth(), DashboardController.getMyDashboard);

export const DashboardRoutes = router;
