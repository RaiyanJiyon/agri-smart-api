import { Router } from 'express';
import validateRequest from '../../shared/validation/validateRequest.js';
import { registerValidationSchema } from './auth.validation.js';
import { AuthController } from './auth.controller.js';

const router = Router();

router.post('/register', validateRequest(registerValidationSchema), AuthController.register);

router.post('/verify-email', AuthController.verifyEmail);

router.post('/resend-verification-email', AuthController.resendVerificationEmail);

export const AuthRoutes = router;
