import { Router } from 'express';
import validateRequest from '../../shared/validation/validateRequest.js';
import {
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  loginValidationSchema,
  registerValidationSchema,
  resendVerificationEmailValidationSchema,
  verifyEmailValidationSchema,
} from './auth.validation.js';
import { AuthController } from './auth.controller.js';
import { auth } from '../../middleware/auth.js';

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

router.post('/refresh-token', AuthController.refreshToken);

router.post('/logout', AuthController.logout);

router.post('/logout-all', auth(), AuthController.logoutAllSessions);

router.post(
  '/change-password',
  auth(),
  validateRequest(changePasswordValidationSchema),
  AuthController.changePassword
);

router.post(
  '/forgot-password',
  validateRequest(forgotPasswordValidationSchema),
  AuthController.forgotPassword
);

export const AuthRoutes = router;
