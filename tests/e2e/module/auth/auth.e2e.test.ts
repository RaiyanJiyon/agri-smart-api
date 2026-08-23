/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import '../../../../src/app/types/express.d.js';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../../../src/app.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';
import { AuthRepository } from '../../../../src/app/modules/auth/auth.repository.js';
import { ProfileRepository } from '../../../../src/app/modules/profile/profile.repository.js';
import { EmailService } from '../../../../src/app/shared/email/email.service.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';

/**
 * Extracts a named cookie string (e.g. "refreshToken=xyz")
 * from Supertest response headers.
 */
const extractCookie = (res: request.Response, cookieName: string): string => {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  if (!cookies) return '';
  const match = cookies.find((c) => c.startsWith(`${cookieName}=`));
  return match ? match.split(';')[0]! : '';
};

describe('Auth API (E2E)', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    // Ensure no real email network requests are sent during E2E testing
    vi.spyOn(EmailService, 'send').mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await teardownTestDatabase();
    vi.restoreAllMocks();
  });

  // ─── 1. POST /api/v1/auth/register ─────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user, create a profile, and store a verification token', async () => {
      const payload = {
        name: 'Jane Farmer',
        email: 'jane@example.com',
        password: 'Password123!',
      };

      const response = await request(app).post('/api/v1/auth/register').send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'Registration successful. Please check your email to verify your account.'
      );
      expect(response.body.data).toMatchObject({
        name: 'Jane Farmer',
        email: 'jane@example.com',
        isEmailVerified: false,
      });

      // Verify User document in DB
      const user = await AuthRepository.findUserByEmail('jane@example.com');
      expect(user).not.toBeNull();
      expect(user?.isEmailVerified).toBe(false);

      // Verify Profile document created in DB
      const profile = await ProfileRepository.findByUserId(user!._id);
      expect(profile).not.toBeNull();

      // Verify Verification token record created in DB
      const verifications = await mongoose.connection
        .collection('verifications')
        .find({ userId: user!._id })
        .toArray();
      expect(verifications).toHaveLength(1);

      // Verify EmailService was called to dispatch verification email
      expect(EmailService.send).toHaveBeenCalledTimes(1);
    });

    it('should return HTTP 400 on Zod validation failure (e.g. short password)', async () => {
      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Short Pass',
        email: 'short@example.com',
        password: '123', // Less than min length
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return HTTP 409 Conflict when attempting to register an existing email', async () => {
      const password = 'Password123!';
      const hashedPassword = await hashPassword(password);

      await AuthRepository.createUser({
        name: 'Existing User',
        email: 'existing@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });

      const response = await request(app).post('/api/v1/auth/register').send({
        name: 'Duplicate User',
        email: 'existing@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists.');
    });
  });

  // ─── 2. POST /api/v1/auth/verify-email ─────────────────────────────────────

  describe('POST /api/v1/auth/verify-email', () => {
    it('should verify email successfully when given a valid verification token', async () => {
      // 1. Register user
      await request(app).post('/api/v1/auth/register').send({
        name: 'Verify User',
        email: 'to-verify@example.com',
        password: 'Password123!',
      });

      // Fetch the token hash stored in DB
      const verification = await mongoose.connection
        .collection('verifications')
        .findOne({ type: 'email_verification' });
      expect(verification).not.toBeNull();

      // Get the raw token from the captured EmailService call HTML link
      const sendEmailCall = vi.mocked(EmailService.send).mock.calls[0];
      expect(sendEmailCall).toBeDefined();
      const htmlBody = sendEmailCall![0].html;
      const match = /token=([a-f0-9]+)/.exec(htmlBody);
      expect(match).not.toBeNull();
      const rawToken = match![1]!;

      // 2. Call verify-email endpoint
      const response = await request(app).post('/api/v1/auth/verify-email').send({
        token: rawToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully.');

      // Check DB updated
      const user = await AuthRepository.findUserByEmail('to-verify@example.com');
      expect(user?.isEmailVerified).toBe(true);
    });

    it('should return HTTP 400 for an invalid or expired verification token', async () => {
      const response = await request(app).post('/api/v1/auth/verify-email').send({
        token: 'invalid-non-existent-token-1234567890',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ─── 3. POST /api/v1/auth/resend-verification-email ───────────────────────

  describe('POST /api/v1/auth/resend-verification-email', () => {
    it('should resend verification email for an unverified user', async () => {
      const hashedPassword = await hashPassword('Password123!');
      await AuthRepository.createUser({
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: false,
        status: 'active',
      });

      const response = await request(app)
        .post('/api/v1/auth/resend-verification-email')
        .send({ email: 'unverified@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(EmailService.send).toHaveBeenCalledTimes(1);
    });
  });

  // ─── 4. POST /api/v1/auth/login ─────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully, set refreshToken cookie, and store session in DB', async () => {
      const password = 'Password123!';
      const hashedPassword = await hashPassword(password);

      const user = await AuthRepository.createUser({
        name: 'Login User',
        email: 'login@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });
      await ProfileRepository.create({ userId: user._id });

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'login@example.com',
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toEqual(expect.any(String));

      // Cookie assertions
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(extractCookie(response, 'refreshToken')).not.toBe('');

      // Session DB assertion
      const sessions = await mongoose.connection
        .collection('sessions')
        .find({ userId: user._id })
        .toArray();
      expect(sessions).toHaveLength(1);
    });

    it('should return HTTP 401 for wrong password', async () => {
      const hashedPassword = await hashPassword('CorrectPassword123!');
      await AuthRepository.createUser({
        name: 'Wrong Pass User',
        email: 'wrongpass@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'wrongpass@example.com',
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return HTTP 403 when user is unverified', async () => {
      const hashedPassword = await hashPassword('Password123!');
      await AuthRepository.createUser({
        name: 'Unverified User',
        email: 'unverified-login@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: false,
        status: 'active',
      });

      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'unverified-login@example.com',
        password: 'Password123!',
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Please verify your email first.');
    });
  });

  // ─── 5. POST /api/v1/auth/refresh-token ───────────────────────────────────

  describe('POST /api/v1/auth/refresh-token', () => {
    it('should refresh access token and rotate refresh token using cookie', async () => {
      const password = 'Password123!';
      const hashedPassword = await hashPassword(password);
      const user = await AuthRepository.createUser({
        name: 'Refresh User',
        email: 'refresh@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });
      await ProfileRepository.create({ userId: user._id });

      // Step 1: Login to acquire refreshToken cookie
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'refresh@example.com',
        password,
      });
      const refreshCookie = extractCookie(loginRes, 'refreshToken');

      // Wait 1s so JWT iat timestamp advances and yields a distinct token string
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Use cookie to request refreshed tokens
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', refreshCookie);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data.accessToken).toEqual(expect.any(String));

      // Assert a new refresh token cookie was set
      const newRefreshCookie = extractCookie(refreshRes, 'refreshToken');
      expect(newRefreshCookie).not.toBe('');
      expect(newRefreshCookie).not.toBe(refreshCookie);
    });

    it('should return HTTP 401 when refresh token cookie is missing', async () => {
      const response = await request(app).post('/api/v1/auth/refresh-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Refresh token is missing.');
    });
  });

  // ─── 6. POST /api/v1/auth/logout ───────────────────────────────────────────

  describe('POST /api/v1/auth/logout', () => {
    it('should log out user, revoke session, and clear refreshToken cookie', async () => {
      const password = 'Password123!';
      const hashedPassword = await hashPassword(password);
      const user = await AuthRepository.createUser({
        name: 'Logout User',
        email: 'logout@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });
      await ProfileRepository.create({ userId: user._id });

      // Step 1: Login
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'logout@example.com',
        password,
      });
      const refreshCookie = extractCookie(loginRes, 'refreshToken');

      // Step 2: Logout
      const logoutRes = await request(app).post('/api/v1/auth/logout').set('Cookie', refreshCookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
      expect(logoutRes.body.message).toBe('Logout successful.');

      // Check session in DB is revoked
      const session = await mongoose.connection
        .collection('sessions')
        .findOne({ userId: user._id });
      expect(session?.revokedAt).not.toBeNull();
    });
  });

  // ─── 7. POST /api/v1/auth/logout-all ───────────────────────────────────────

  describe('POST /api/v1/auth/logout-all', () => {
    it('should revokes all active sessions for authenticated user', async () => {
      const password = 'Password123!';
      const hashedPassword = await hashPassword(password);
      const user = await AuthRepository.createUser({
        name: 'Logout All User',
        email: 'logoutall@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });
      await ProfileRepository.create({ userId: user._id });

      // Login twice to create 2 sessions
      const loginRes1 = await request(app).post('/api/v1/auth/login').send({
        email: 'logoutall@example.com',
        password,
      });
      await request(app).post('/api/v1/auth/login').send({
        email: 'logoutall@example.com',
        password,
      });

      const accessToken = loginRes1.body.data.accessToken as string;

      // Call logout-all with Bearer accessToken
      const logoutAllRes = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutAllRes.status).toBe(200);
      expect(logoutAllRes.body.success).toBe(true);

      // Verify all sessions in DB are revoked
      const activeSessions = await mongoose.connection
        .collection('sessions')
        .find({ userId: user._id, revokedAt: null })
        .toArray();
      expect(activeSessions).toHaveLength(0);
    });

    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app).post('/api/v1/auth/logout-all');

      expect(response.status).toBe(401);
    });
  });

  // ─── 8. POST /api/v1/auth/change-password ─────────────────────────────────

  describe('POST /api/v1/auth/change-password', () => {
    it('should change password successfully when current password matches', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword123!';
      const hashedPassword = await hashPassword(oldPassword);

      const user = await AuthRepository.createUser({
        name: 'Change Pass User',
        email: 'changepass@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });
      await ProfileRepository.create({ userId: user._id });

      // Login to get access token
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'changepass@example.com',
        password: oldPassword,
      });
      const accessToken = loginRes.body.data.accessToken as string;

      // Change password
      const changeRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: oldPassword,
          newPassword,
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // Verify login with old password fails
      const oldLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'changepass@example.com',
        password: oldPassword,
      });
      expect(oldLoginRes.status).toBe(401);

      // Verify login with new password succeeds
      const newLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'changepass@example.com',
        password: newPassword,
      });
      expect(newLoginRes.status).toBe(200);
    });
  });

  // ─── 9. POST /api/v1/auth/forgot-password ─────────────────────────────────

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should trigger password reset email dispatch for existing user', async () => {
      const hashedPassword = await hashPassword('Password123!');
      await AuthRepository.createUser({
        name: 'Forgot Pass User',
        email: 'forgot@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });

      const response = await request(app).post('/api/v1/auth/forgot-password').send({
        email: 'forgot@example.com',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(EmailService.send).toHaveBeenCalledTimes(1);

      // Check reset token created in DB
      const resetVerification = await mongoose.connection
        .collection('verifications')
        .findOne({ type: 'password_reset' });
      expect(resetVerification).not.toBeNull();
    });
  });

  // ─── 10. POST /api/v1/auth/reset-password ──────────────────────────────────

  describe('POST /api/v1/auth/reset-password', () => {
    it('should reset password successfully when given a valid reset token', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'BrandNewPassword123!';
      const hashedPassword = await hashPassword(oldPassword);

      await AuthRepository.createUser({
        name: 'Reset User',
        email: 'reset@example.com',
        password: hashedPassword,
        role: 'farmer',
        isEmailVerified: true,
        status: 'active',
      });

      // 1. Request forgot password
      await request(app).post('/api/v1/auth/forgot-password').send({
        email: 'reset@example.com',
      });

      // Extract raw token from EmailService.send call HTML link
      const sendEmailCall = vi.mocked(EmailService.send).mock.calls[0];
      const htmlBody = sendEmailCall![0].html;
      const match = /token=([a-f0-9]+)/.exec(htmlBody);
      expect(match).not.toBeNull();
      const rawToken = match![1]!;

      // 2. Perform reset password
      const resetRes = await request(app).post('/api/v1/auth/reset-password').send({
        token: rawToken,
        newPassword,
      });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Verify user can log in with new password
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'reset@example.com',
        password: newPassword,
      });
      expect(loginRes.status).toBe(200);
    });

    it('should return HTTP 400 for invalid/expired reset token', async () => {
      const response = await request(app).post('/api/v1/auth/reset-password').send({
        token: 'invalid-token-xyz',
        newPassword: 'BrandNewPassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
