import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ApiError } from '../../errors/AppError.js';
import type { JwtPayload } from '../../shared/types/jwt.js';
import { comparePassword, hashPassword } from '../../utils/argon.js';
import { JwtUtil } from '../../utils/jwt.js';
import { SessionService } from '../session/session.service.js';
import { VerificationService } from '../verification/verification.service.js';
import type { ChangePasswordPayload, LoginPayload, User } from './auth.interface.js';
import { AuthRepository } from './auth.repository.js';
import { getRefreshTokenExpiry } from './auth.utils.js';

const register = async (payload: Pick<User, 'name' | 'email' | 'password'>): Promise<User> => {
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

const login = async (payload: LoginPayload) => {
  const existingUser = await AuthRepository.findUserByEmailWithPassword(payload.email);

  if (!existingUser) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password.');
  }

  if (!existingUser.password) {
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'User password is missing.');
  }

  const passwordMatched = await comparePassword(payload.password, existingUser.password);

  if (!passwordMatched) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password.');
  }

  if (!existingUser.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Please verify your email first.');
  }

  const jwtPayload: JwtPayload = {
    userId: existingUser._id.toString(),
    email: existingUser.email,
    role: existingUser.role,
  };

  const accessToken = JwtUtil.signAccessToken(jwtPayload);
  const refreshToken = JwtUtil.signRefreshToken(jwtPayload);

  await SessionService.createSession({
    userId: existingUser._id,
    refreshToken: refreshToken,
    ipAddress: payload.ipAddress ?? '',
    userAgent: payload.userAgent ?? 'unknown',
    expiresAt: getRefreshTokenExpiry(),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: existingUser._id,
      name: existingUser.name,
      email: existingUser.email,
      isEmailVerified: existingUser.isEmailVerified,
    },
  };
};

const changePassword = async (payload: ChangePasswordPayload) => {
  const user = await AuthRepository.findUserByIdWithPassword(payload.userId);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  const matched = await comparePassword(payload.currentPassword, user.password);
  if (!matched) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect.');
  }

  const samePassword = await comparePassword(payload.newPassword, user.password);

  if (samePassword) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'New password must be different from the current password.'
    );
  }

  const hashedPassword = await hashPassword(payload.newPassword);

  const updatedUser = await AuthRepository.updatePassword(payload.userId, hashedPassword);

  if (!updatedUser) {
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to update password.');
  }

  await SessionService.revokeAllSessions(payload.userId);
};

export const AuthService = {
  register,
  login,
  changePassword,
};
