import type { Request, Response } from 'express';
import { catchAsync } from '../../shared/utils/catchAsync.js';
import { AuthService } from './auth.service.js';
import type { User } from './auth.interface.js';
import { sendResponse } from '../../shared/utils/sendResponse.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';
import { VerificationService } from '../verification/verification.service.js';
import { COOKIE_NAME } from '../../shared/constants/cookie.js';
import { getClearCookieOptions, getRefreshTokenCookieOptions } from '../../shared/utils/cookie.js';
import { ApiError } from '../../shared/errors/AppError.js';
import { TokenService } from './token.service.js';
import { Types } from 'mongoose';

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body as Pick<User, 'name' | 'email' | 'password'>);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: result,
  });
});

// Explicitly type req with generic Request<Params, ResBody, ReqBody>
const verifyEmail = catchAsync(
  async (req: Request<unknown, unknown, { token: string }>, res: Response) => {
    const { token } = req.body; // Now strongly typed as string

    await VerificationService.verifyEmail(token);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Email verified successfully.',
      data: null,
    });
  }
);

const resendVerificationEmail = catchAsync(
  async (req: Request<unknown, unknown, { email: string }>, res: Response) => {
    const { email } = req.body;

    await VerificationService.sendVerificationEmail(email);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'If an account exists and is not verified, a verification email has been sent.',
      data: null,
    });
  }
);

const login = catchAsync(
  async (
    req: Request<
      unknown,
      unknown,
      {
        email: string;
        password: string;
      }
    >,
    res: Response
  ) => {
    const result = await AuthService.login({
      ...req.body,
      ipAddress: req.ip ?? '',
      userAgent: req.get('User-Agent') ?? 'unknown',
    });

    res.cookie(COOKIE_NAME.REFRESH_TOKEN, result.refreshToken, getRefreshTokenCookieOptions());

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Login successful.',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  }
);

const refreshToken = catchAsync(async (req, res) => {
  const cookies = req.cookies as { refreshToken?: string };
  const refreshToken = cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token is missing.');
  }

  const tokens = await TokenService.refreshTokens(refreshToken);

  res.cookie(COOKIE_NAME.REFRESH_TOKEN, tokens.refreshToken, getRefreshTokenCookieOptions());

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Access token refreshed successfully.',
    data: {
      accessToken: tokens.accessToken,
    },
  });
});

const logout = catchAsync(async (req, res) => {
  const cookies = req.cookies as { refreshToken?: string };
  const refreshToken = cookies.refreshToken;

  if (refreshToken) {
    await TokenService.logout(refreshToken);
  }

  res.clearCookie(COOKIE_NAME.REFRESH_TOKEN, getClearCookieOptions());

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Logout successful.',
    data: null,
  });
});

const logoutAllSessions = catchAsync(async (req, res: Response) => {
  await TokenService.logoutAllSessions(new Types.ObjectId(req.user?.userId));

  res.clearCookie(COOKIE_NAME.REFRESH_TOKEN, getClearCookieOptions());

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Logged out from all devices successfully.',
    data: null,
  });
});

const changePassword = catchAsync(
  async (
    req: Request<
      unknown,
      unknown,
      {
        currentPassword: string;
        newPassword: string;
      }
    >,
    res: Response
  ) => {
    const userId = req.user?.userId;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid user identity.');
    }

    const objectId = new Types.ObjectId(userId);

    await AuthService.changePassword({
      userId: objectId,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    res.clearCookie(COOKIE_NAME.REFRESH_TOKEN, getClearCookieOptions());

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Password changed successfully. Please log in again.',
      data: null,
    });
  }
);

const forgotPassword = catchAsync(
  async (req: Request<unknown, unknown, { email: string }>, res: Response) => {
    const { email } = req.body;

    await VerificationService.sendPasswordResetEmail(email);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'If an account exists, a password reset email has been sent.',
      data: null,
    });
  }
);

const resetPassword = catchAsync(
  async (req: Request<unknown, unknown, { token: string; newPassword: string }>, res: Response) => {
    await VerificationService.resetPassword(req.body.token, req.body.newPassword);

    res.clearCookie(COOKIE_NAME.REFRESH_TOKEN, getClearCookieOptions());

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
      data: null,
    });
  }
);

export const AuthController = {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  refreshToken,
  logout,
  logoutAllSessions,
  changePassword,
  forgotPassword,
  resetPassword,
};
