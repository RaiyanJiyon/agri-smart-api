import { Router } from 'express';
import { HealthRoutes } from '../modules/health/health.route.js';
import { AuthRoutes } from '../modules/auth/auth.route.js';
import { ProfileRoutes } from '../modules/profile/profile.route.js';
import { FarmRoutes } from '../modules/farm/farm.route.js';
import { DashboardRoutes } from '../modules/dashboard/dashboard.route.js';
import { CropRecommendationRoutes } from '../modules/crop-recommendations/crop-recommendation.route.js';
import { DiseaseDetectionRoutes } from '../modules/disease-detection/disease-detection.route.js';
import { AiAssistantRoutes } from '../modules/ai-assistant/conversation/ai-assistant.route.js';

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
  {
    path: '/farms',
    route: FarmRoutes,
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
  {
    path: '/crop-recommendations',
    route: CropRecommendationRoutes,
  },
  {
    path: '/disease-detection',
    route: DiseaseDetectionRoutes,
  },
  {
    path: '/ai-assistant',
    route: AiAssistantRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
