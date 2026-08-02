import type { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { AuthService } from './auth.service.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import type { IUser } from './auth.interface.js';

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body as Pick<IUser, 'name' | 'email' | 'password'>);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: '',
    data: result,
  });
});

export const AuthController = {
  register,
};
