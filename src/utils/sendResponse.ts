import type { Response } from "express";

interface TResponse<T> {
    statusCode: number;
    success: boolean;
    message?: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
    };
    data: T;
};

export const sendResponse = <T>(res: Response, data: TResponse<T>): void => {
    res.status(data.statusCode).json({
        success: data.success,
        statusCode: data.statusCode,
        message: data.message ?? 'Success',
        meta: data.meta ?? undefined,
        data: data.data,
    });
};

