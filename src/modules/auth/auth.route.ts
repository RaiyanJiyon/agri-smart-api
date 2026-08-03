import { Router } from 'express';
import validateRequest from '../../shared/validation/validateRequest.js';
import {
  loginValidationSchema,
  registerValidationSchema,
  resendVerificationEmailValidationSchema,
  verifyEmailValidationSchema,
} from './auth.validation.js';
import { AuthController } from './auth.controller.js';

const router = Router();

router.post('/register', validateRequest(registerValidationSchema), AuthController.register);

router.post(
  '/verify-email',
  validateRequest(verifyEmailValidationSchema),
  AuthController.verifyEmail
);

router.post(
  '/resend-verification-email',
  validateRequest(resendVerificationEmailValidationSchema),
  AuthController.resendVerificationEmail
);

router.post('/login', validateRequest(loginValidationSchema), AuthController.login);

export const AuthRoutes = router;
