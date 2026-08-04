import { COOKIE_NAME } from '../../constants/cookie.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ApiError } from '../../errors/AppError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { getRefreshTokenCookieOptions } from '../../utils/cookie.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { TokenService } from './token.service.js';

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

export const TokenController = {
  refreshToken,
};
