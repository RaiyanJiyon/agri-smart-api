import { Router } from 'express';
import { auth } from '../../shared/middleware/auth.js';
import validateRequest from '../../shared/validation/validateRequest.js';
import { createCropRecommendationValidationSchema } from './crop-recommendation.validation.js';
import { CropRecommendationController } from './crop-recommendation.controller.js';

const router = Router();

router.post(
  '/',
  auth(),
  validateRequest(createCropRecommendationValidationSchema),
  CropRecommendationController.createCropRecommendation
);

router.get('/', auth(), CropRecommendationController.getMyRecommendations);

router.get('/:recommendationId', auth(), CropRecommendationController.getMyRecommendation);

router.delete('/:recommendationId', auth(), CropRecommendationController.deleteMyRecommendation);

export const CropRecommendationRoutes = router;
