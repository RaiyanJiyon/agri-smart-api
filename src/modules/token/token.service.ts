import { config } from '../../config/env.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ApiError } from '../../errors/AppError.js';
import { JwtUtil } from '../../utils/jwt.js';
import type { IAuthTokens } from '../auth/auth.interface.js';
import { AuthRepository } from '../auth/auth.repository.js';
import { SessionService } from '../session/session.service.js';

const refreshTokens = async (refreshToken: string): Promise<IAuthTokens> => {
  const payload = JwtUtil.verifyRefreshToken(refreshToken);

  const session = await SessionService.findActiveSession(refreshToken);

  if (!session) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token.');
  }

  if (payload.userId !== session.userId.toString()) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token.');
  }

  const user = await AuthRepository.findUserById(session.userId);

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
  }

  if (!user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Email is not verified.');
  }

  const jwtPayload = {
    userId: user._id.toString(),
    email: user.email,
  };

  const newAccessToken = JwtUtil.signAccessToken(jwtPayload);

  const newRefreshToken = JwtUtil.signRefreshToken(jwtPayload);

  const expiresAt = new Date(Date.now() + config.JWT.JWT_REFRESH_EXPIRES_IN);

  await SessionService.rotateRefreshToken(session._id, newRefreshToken, expiresAt);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const TokenService = {
  refreshTokens,
};
