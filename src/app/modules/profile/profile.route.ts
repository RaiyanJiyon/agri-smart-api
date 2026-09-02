import { Router } from 'express';
import { ProfileController } from './profile.controller.js';
import { validateRequest } from '../../shared/validation/index.js';
import { UpdateProfileValidationSchema } from './profile.validation.js';
import { auth } from '../../shared/middleware/index.js';

const router = Router();

router.get('/me', auth(), ProfileController.getMyProfile);
router.patch(
  '/me',
  auth(),
  validateRequest(UpdateProfileValidationSchema),
  ProfileController.updateMyProfile
);

export const ProfileRoutes = router;
