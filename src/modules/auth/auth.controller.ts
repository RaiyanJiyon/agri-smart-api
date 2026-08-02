import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { AuthService } from './auth.service.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import type { IUser } from './auth.interface.js';
import { VerificationService } from '../verification/verification.service.js';
import type { Types } from 'mongoose';

// Define expected request body shapes
interface VerifyEmailBody {
  token: string;
}

interface ResendEmailBody {
  userId: Types.ObjectId;
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
    const { userId } = req.body; // Now strongly typed as string

    await VerificationService.sendVerificationEmail(userId);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      success: true,
      message: 'Verification email sent successfully.',
      data: null,
    });
  }
);

export const AuthController = {
  register,
  verifyEmail,
  resendVerificationEmail,
};
