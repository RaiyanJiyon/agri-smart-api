import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileController } from '../../../../src/app/modules/profile/profile.controller.js';
import type { JwtPayload } from '../../../../src/app/shared/types/jwt.js';

type MockRequest = Omit<Partial<Request>, 'user'> & {
  user?: Pick<JwtPayload, 'userId' | 'role'> | undefined;
};

type AsyncHandler = (req: Request, res: Response, next: ReturnType<typeof vi.fn>) => Promise<void>;

describe('ProfileController unit error branches', () => {
  let mockReq: MockRequest;
  let mockRes: Partial<Response>;
  let nextFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFn = vi.fn();
  });

  it('should pass 401 error to next when req.user is undefined in getMyProfile', async () => {
    mockReq.user = undefined;

    const getMyProfile = ProfileController.getMyProfile as unknown as AsyncHandler;
    await getMyProfile(mockReq as Request, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'User not found.',
      })
    );
  });

  it('should pass 401 error to next when userId is invalid ObjectId in getMyProfile', async () => {
    mockReq.user = { userId: 'invalid-id', role: 'farmer' };

    const getMyProfile = ProfileController.getMyProfile as unknown as AsyncHandler;
    await getMyProfile(mockReq as Request, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid user identity.',
      })
    );
  });

  it('should pass 401 error to next when req.user is undefined in updateMyProfile', async () => {
    mockReq.user = undefined;

    const updateMyProfile = ProfileController.updateMyProfile as unknown as AsyncHandler;
    await updateMyProfile(mockReq as Request, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'User not found.',
      })
    );
  });

  it('should pass 401 error to next when userId is invalid ObjectId in updateMyProfile', async () => {
    mockReq.user = { userId: 'invalid-id', role: 'farmer' };

    const updateMyProfile = ProfileController.updateMyProfile as unknown as AsyncHandler;
    await updateMyProfile(mockReq as Request, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid user identity.',
      })
    );
  });
});
