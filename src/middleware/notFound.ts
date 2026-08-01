import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "../constants/statusCodes.js";

export const notFound = (req: Request, res: Response, _next: NextFunction) => {
    res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: `Not Found - ${req.originalUrl}`,
    });
};