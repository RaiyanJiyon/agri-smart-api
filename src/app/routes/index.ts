import { Router } from 'express';
import { HealthRoutes } from '../modules/health/health.route.js';
import { AuthRoutes } from '../modules/auth/auth.route.js';
import { ProfileRoutes } from '../modules/profile/profile.route.js';

export const router = Router();

const moduleRoutes = [
  {
    path: '/health',
    route: HealthRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/profile',
    route: ProfileRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
