import { config } from '../../config/env.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ApiError } from '../../errors/AppError.js';
import { comparePassword, hashPassword } from '../../utils/argon.js';
import { JwtUtil } from '../../utils/jwt.js';
import { SessionService } from '../session/session.service.js';
import { VerificationService } from '../verification/verification.service.js';
import type { ILoginPayload, IUser } from './auth.interface.js';
import { AuthRepository } from './auth.repository.js';

const register = async (payload: Pick<IUser, 'name' | 'email' | 'password'>): Promise<IUser> => {
  const existingUser = await AuthRepository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'User already exists.');
  }

  const hashedPassword = await hashPassword(payload.password);

  const user = await AuthRepository.createUser({
    ...payload,
    password: hashedPassword,
  });

  await VerificationService.sendVerificationEmail(user.email);

  return user;
};

const login = async (payload: ILoginPayload) => {
  const user = await AuthRepository.findUserByEmailWithPassword(payload.email);

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password.');
  }

  if (!user.password) {
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'User password is missing.');
  }

  const passwordMatched = await comparePassword(payload.password, user.password);

  if (!passwordMatched) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password.');
  }

  if (!user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Please verify your email first.');
  }

  const jwtPayload = {
    userId: user._id.toString(),
    email: user.email,
  };

  const accessToken = JwtUtil.signAccessToken(jwtPayload);
  const refreshToken = JwtUtil.signRefreshToken(jwtPayload);

  await SessionService.createSession({
    userId: user._id,
    refreshToken: refreshToken,
    ipAddress: payload.ipAddress ?? '',
    userAgent: payload.userAgent ?? 'unknown',
    expiresAt: new Date(Date.now() + config.JWT.JWT_REFRESH_EXPIRES_IN),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    },
  };
};

export const AuthService = {
  register,
  login,
};
