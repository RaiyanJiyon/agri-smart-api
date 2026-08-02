import type { Response } from 'express';

interface TResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export const sendResponse = <T>(res: Response, data: TResponse<T>): void => {
  res.status(data.statusCode).json({
    statusCode: data.statusCode,
    success: data.success,
    message: data.message ?? 'Success',
    data: data.data,
    meta: data.meta ?? undefined,
  });
};
