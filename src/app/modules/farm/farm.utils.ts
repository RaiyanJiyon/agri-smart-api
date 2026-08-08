import  { Types } from "mongoose";
import { ApiError } from "../../shared/errors/AppError.js";
import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import type { Request } from "express";

export const getUserObjectId = (req: Pick<Request, "user">): Types.ObjectId => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not found.");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid user identity.");
  }

  return new Types.ObjectId(userId);
};

export const getFarmObjectId = (farmId: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(farmId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid farm ID.");
  }

  return new Types.ObjectId(farmId);
};