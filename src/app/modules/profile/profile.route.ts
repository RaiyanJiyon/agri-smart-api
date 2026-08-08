import { Router } from 'express';
import { ProfileController } from './profile.controller.js';
import validateRequest from '../../shared/validation/validateRequest.js';
import { UpdateProfileValidationSchema } from './profile.validation.js';
import { auth } from '../../shared/middleware/auth.js';

const router = Router();

router.get('/me', auth(), ProfileController.getMyProfile);
router.put(
  '/me',
  auth(),
  validateRequest(UpdateProfileValidationSchema),
  ProfileController.updateMyProfile
);

export const ProfileRoutes = router;
