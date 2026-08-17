import { Router } from 'express';
import validateRequest from '../../shared/validation/validateRequest.js';
import {
  changePasswordValidationSchema,
  forgotPasswordValidationSchema,
  loginValidationSchema,
  registerValidationSchema,
  resendVerificationEmailValidationSchema,
  resetPasswordValidationSchema,
  verifyEmailValidationSchema,
} from './auth.validation.js';
import { AuthController } from './auth.controller.js';
import { auth } from '../../shared/middleware/auth.js';
import { authRateLimiter } from '../../shared/middleware/rateLimiter.js';

const router = Router();

// Apply Tier 0 Auth Rate Limiting (IP + Email tracking, 10 attempts / 15 mins, Fail-Closed)
router.use(authRateLimiter);

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

router.post(
  '/reset-password',
  validateRequest(resetPasswordValidationSchema),
  AuthController.resetPassword
);

export const AuthRoutes = router;
