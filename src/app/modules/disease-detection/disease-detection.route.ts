import { Router } from 'express';
import { auth, uploadCropImage, aiRateLimiter } from '../../shared/middleware/index.js';
import { validateRequest } from '../../shared/validation/index.js';
import { createDiseaseDetectionValidationSchema } from './disease-detection.validation.js';
import { DiseaseDetectionController } from './disease-detection.controller.js';

const router = Router();

router.post(
  '/',
  auth(),
  aiRateLimiter,
  uploadCropImage.single('image'),
  validateRequest(createDiseaseDetectionValidationSchema),
  DiseaseDetectionController.createDiseaseDetection
);

router.get('/', auth(), DiseaseDetectionController.getMyReports);

router.get('/:reportId', auth(), DiseaseDetectionController.getMyReport);

router.delete('/:reportId', auth(), DiseaseDetectionController.deleteMyReport);

export const DiseaseDetectionRoutes = router;
