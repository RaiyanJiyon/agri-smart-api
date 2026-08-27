import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardController } from '../../../../src/app/modules/dashboard/dashboard.controller.js';

type AsyncHandler = (req: Request, res: Response, next: ReturnType<typeof vi.fn>) => Promise<void>;

describe('DashboardController unit error branches', () => {
  let mockReq: Partial<Request>;
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

  it('should pass 401 UNAUTHORIZED error to next when req.user is undefined in getMyDashboard', async () => {
    mockReq = {};

    const getMyDashboard = DashboardController.getMyDashboard as unknown as AsyncHandler;

    await getMyDashboard(mockReq as Request, mockRes as Response, nextFn);

    expect(nextFn).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'User not found.',
      })
    );
  });
});
