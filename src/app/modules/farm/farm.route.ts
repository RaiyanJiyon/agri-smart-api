import { Router } from 'express';
import { FarmController } from './farm.controller.js';
import { validateRequest } from '../../shared/validation/index.js';
import { createFarmValidationSchema, updateFarmValidationSchema } from './farm.validation.js';
import { auth } from '../../shared/middleware/index.js';

const router = Router();

router.post('/', auth(), validateRequest(createFarmValidationSchema), FarmController.createFarm);

router.get('/', auth(), FarmController.getMyFarms);

router.get('/:farmId', auth(), FarmController.getMyFarm);

router.patch(
  '/:farmId',
  auth(),
  validateRequest(updateFarmValidationSchema),
  FarmController.updateMyFarm
);

router.delete('/:farmId', auth(), FarmController.deleteMyFarm);

export const FarmRoutes = router;
