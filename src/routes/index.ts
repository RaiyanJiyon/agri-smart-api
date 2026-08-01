import { Router } from 'express';
import healthRoutes from '../modules/health/health.route.js';

export const router = Router();

const moduleRoutes = [
  {
    path: '/health',
    route: healthRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
