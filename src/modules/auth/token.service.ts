import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ApiError } from '../../errors/AppError.js';
import { JwtUtil } from '../../utils/jwt.js';
import type { IAuthTokens } from './auth.interface.js';
import { AuthRepository } from './auth.repository.js';
import type { Session } from '../session/session.interface.js';
import { SessionService } from '../session/session.service.js';
import type { IJwtPayload } from '../../shared/types/jwt.js';
import type { HydratedDocument, Types } from 'mongoose';
import { getRefreshTokenExpiry } from './auth.utils.js';

interface IActiveRefreshSession {
  payload: IJwtPayload;
  session: HydratedDocument<Session>;
}

/**
 * * HELPER: Validates a refresh token's cryptographic signature,
 * * checks database session activity, and ensures identity consistency
 * * before returning the payload and session data.
 */
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
    role: user.role,
  };

  const newAccessToken = JwtUtil.signAccessToken(jwtPayload);
  const newRefreshToken = JwtUtil.signRefreshToken(jwtPayload);
  const expiresAt = getRefreshTokenExpiry();

  await SessionService.rotateRefreshToken(session._id, newRefreshToken, expiresAt);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async (refreshToken: string): Promise<void> => {
  try {
    // Leverage the helper function cleanly in logout too
    const { session } = await getActiveSessionFromRefreshToken(refreshToken);

    await SessionService.revokeSession(session._id);
  } catch {
    // Ignore invalid/expired tokens during logout
  }
};

const logoutAllSessions = async (userId: Types.ObjectId): Promise<void> => {
  await SessionService.revokeAllSessions(userId);
};

export const TokenService = {
  refreshTokens,
  logout,
  logoutAllSessions,
};
