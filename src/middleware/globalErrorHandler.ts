import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "../constants/statusCodes.js";
import { envVars } from "../config/env.js";

interface AppError {
    statusCode?: number;
    message?: string;
    code?: string;
    isOperational?: boolean;
    stack?: string;
};

export const globalErrorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    let statusCode = err.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
    let message = err.message ?? "Internal Server Error";

    if (err.code === "P2002") {
        statusCode = StatusCodes.CONFLICT;
        message = "A record with this field already exists.";
    }

    // Operational vs Programming error logging distinction
    if (!err.isOperational) {
        // Log unexpected bugs to an external monitoring tool (e.g., Sentry, Datadog)
        console.error('UNEXPECTED CRITICAL ERROR:', err);
    }

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
        // Expose stack trace only in development mode for debugging
        ...(envVars.NODE_ENV === 'development' && { stack: err.stack }),
    })
}