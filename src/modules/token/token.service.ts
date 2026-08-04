import { config } from '../../config/env.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ApiError } from '../../errors/AppError.js';
import { JwtUtil } from '../../utils/jwt.js';
import type { IAuthTokens } from '../auth/auth.interface.js';
import { AuthRepository } from '../auth/auth.repository.js';
import type { ISession } from '../session/session.interface.js';
import { SessionService } from '../session/session.service.js';
import type { IJwtPayload } from '../../types/jwt.js';
import type { Types } from 'mongoose';

interface IActiveRefreshSession {
  payload: IJwtPayload;
  session: ISession;
}

const getActiveSessionFromRefreshToken = async (
  refreshToken: string
): Promise<IActiveRefreshSession> => {
  const payload = JwtUtil.verifyRefreshToken(refreshToken);

  const session = await SessionService.findActiveSession(refreshToken);

  if (!session) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid or expired refresh token.');
  }

  if (payload.userId !== session.userId.toString()) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token.');
  }

  return {
    payload,
    session,
  };
};

const refreshTokens = async (refreshToken: string): Promise<IAuthTokens> => {
  // The helper already handles all validation (verify, existence, and userId match)
  const { session } = await getActiveSessionFromRefreshToken(refreshToken);

  const user = await AuthRepository.findUserById(session.userId);

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
  }

  if (!user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Email is not verified.');
  }

  const jwtPayload: IJwtPayload = {
    userId: user._id.toString(),
    email: user.email,
  };

  const newAccessToken = JwtUtil.signAccessToken(jwtPayload);
  const newRefreshToken = JwtUtil.signRefreshToken(jwtPayload);
  const expiresAt = new Date(Date.now() + config.JWT.JWT_REFRESH_EXPIRES_IN);

  await SessionService.rotateRefreshToken(session.userId, newRefreshToken, expiresAt);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async (refreshToken: string): Promise<void> => {
  try {
    // Leverage the helper function cleanly in logout too
    const { session } = await getActiveSessionFromRefreshToken(refreshToken);
    await SessionService.revokeSession(session.userId);
  } catch {
    // Ignore invalid/expired tokens during logout
  }
};

const logoutAllSessions = async (userId: Types.ObjectId): Promise<void> => {
  await SessionService.revokeAllSessions(userId);
}

export const TokenService = {
  refreshTokens,
  logout,
  logoutAllSessions,
};
