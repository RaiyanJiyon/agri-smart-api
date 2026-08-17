import { Router } from 'express';
import { auth } from '../../shared/middleware/auth.js';
import { uploadCropImage } from '../../shared/middleware/upload.js';
import validateRequest from '../../shared/validation/validateRequest.js';
import { createDiseaseDetectionValidationSchema } from './disease-detection.validation.js';
import { DiseaseDetectionController } from './disease-detection.controller.js';
import { aiRateLimiter } from '../../shared/middleware/rateLimiter.js';

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

