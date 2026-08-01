import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "../constants/statusCodes.js";
import { AppError } from "../errors/AppError.js";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Not Found - ${req.originalUrl}`, StatusCodes.NOT_FOUND))
};