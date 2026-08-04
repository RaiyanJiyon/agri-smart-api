import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { AuthService } from './auth.service.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import type { IUser } from './auth.interface.js';
import { VerificationService } from '../verification/verification.service.js';
import { getRefreshTokenCookieOptions } from '../../utils/cookie.js';
import { COOKIE_NAME } from '../../constants/cookie.js';
import { TokenService } from '../token/token.service.js';
import { ApiError } from '../../errors/AppError.js';
import { Types } from 'mongoose';

// Define expected request body shapes
interface VerifyEmailBody {
  token: string;
}

interface ResendEmailBody {
  email: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

interface ForgotPasswordBody {
  email: string;
}

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body as Pick<IUser, 'name' | 'email' | 'password'>);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    data: result,
  });
});

// Explicitly type req with generic Request<Params, ResBody, ReqBody>
const verifyEmail = catchAsync(
  async (req: Request<unknown, unknown, VerifyEmailBody>, res: Response) => {
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
  async (req: Request<unknown, unknown, ResendEmailBody>, res: Response) => {
    const { email } = req.body; // Now strongly typed as string

    await VerificationService.sendVerificationEmail(email);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'If an account exists and is not verified, a verification email has been sent.',
      data: null,
    });
  }
);

const login = catchAsync(async (req: Request<unknown, unknown, LoginBody>, res: Response) => {
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
});

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

  res.clearCookie(COOKIE_NAME.REFRESH_TOKEN, getRefreshTokenCookieOptions());

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Logout successful.',
    data: null,
  });
});

const logoutAllSessions = catchAsync(async (req, res: Response) => {
  await TokenService.logoutAllSessions(new Types.ObjectId(req.user?.userId));

  res.clearCookie(COOKIE_NAME.REFRESH_TOKEN, getRefreshTokenCookieOptions());

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Logged out from all devices successfully.',
    data: null,
  });
});

const changePassword = catchAsync(
  async (req: Request<unknown, unknown, ChangePasswordBody>, res: Response) => {
    await AuthService.changePassword({
      userId: new Types.ObjectId(req.user.userId),
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    res.clearCookie(COOKIE_NAME.REFRESH_TOKEN, getRefreshTokenCookieOptions());

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Password changed successfully. Please log in again.',
      data: null,
    });
  }
);

const forgotPassword = catchAsync(
  async (req: Request<unknown, unknown, ForgotPasswordBody>, res: Response) => {
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
};
