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

export const AuthController = {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
};
