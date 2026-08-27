/* eslint-disable @typescript-eslint/unbound-method */
import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { sendResponse } from '../../../../src/app/shared/utils/sendResponse.js';

describe('sendResponse utility', () => {
  it('should send a JSON response with statusCode, success, message, and data', () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    sendResponse(mockRes, {
      statusCode: 200,
      success: true,
      message: 'Data retrieved successfully.',
      data: { id: '123' },
    });

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      statusCode: 200,
      success: true,
      message: 'Data retrieved successfully.',
      data: { id: '123' },
    });
  });

  it('should fallback to "Success" when message is omitted', () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    sendResponse(mockRes, {
      statusCode: 201,
      success: true,
      data: null,
    });

    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Success' }));
  });

  it('should include meta field when provided', () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    const meta = { page: 1, limit: 10, total: 50 };

    sendResponse(mockRes, {
      statusCode: 200,
      success: true,
      data: [],
      meta,
    });

    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ meta }));
  });

  it('should NOT include meta field when meta is undefined', () => {
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    sendResponse(mockRes, {
      statusCode: 200,
      success: true,
      data: [],
    });

    const jsonCalls = vi.mocked(mockRes.json).mock.calls;
    expect(jsonCalls.length).toBe(1);
    expect(jsonCalls[0]).toBeDefined();
    const payload = jsonCalls[0]![0] as { meta?: unknown };
    expect(payload.meta).toBeUndefined();
  });
});
