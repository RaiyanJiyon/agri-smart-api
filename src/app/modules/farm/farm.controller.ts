import { HTTP_STATUS } from "../../shared/constants/httpStatus.js";
import { catchAsync } from "../../shared/utils/catchAsync.js";
import { FarmService } from "./farm.service.js";
import { sendResponse } from "../../shared/utils/sendResponse.js";
import type { CreateFarmBody, UpdateFarmBody } from "./farm.interface.js";
import type { Request, Response } from "express";
import { getFarmObjectId, getUserObjectId } from "./farm.utils.js";

const createFarm = catchAsync(
  async (req: Request, res: Response) => {
    const userId = getUserObjectId(req);
    const payload = req.body as CreateFarmBody;

    const data = await FarmService.createFarm(userId, payload);

    sendResponse(res, {
      success: true,
      statusCode: HTTP_STATUS.CREATED,
      message: "Farm created successfully.",
      data,
    });
  }
);

const getMyFarms = catchAsync(async (req: Request, res: Response) => {
  const userId = getUserObjectId(req);

  const data = await FarmService.getMyFarms(userId);

  sendResponse(res, {
    success: true,
    statusCode: HTTP_STATUS.OK,
    message: "Farms retrieved successfully.",
    data,
  });
});

const getMyFarm = catchAsync(
  async (req: Request, res: Response) => {
    const userId = getUserObjectId(req);
    const { farmId } = req.params as { farmId: string };
    const farmObjectId = getFarmObjectId(farmId);

    const data = await FarmService.getMyFarm(userId, farmObjectId);

    sendResponse(res, {
      success: true,
      statusCode: HTTP_STATUS.OK,
      message: "Farm retrieved successfully.",
      data,
    });
  }
);

const updateMyFarm = catchAsync(
  async (req: Request, res: Response) => {
    const userId = getUserObjectId(req);
    const { farmId } = req.params as { farmId: string };
    const farmObjectId = getFarmObjectId(farmId);
    const body = req.body as UpdateFarmBody;

    const data = await FarmService.updateMyFarm(userId, farmObjectId, body);

    sendResponse(res, {
      success: true,
      statusCode: HTTP_STATUS.OK,
      message: "Farm updated successfully.",
      data,
    });
  }
);

const deleteMyFarm = catchAsync(
  async (req: Request, res: Response) => {
    const userId = getUserObjectId(req);
    const { farmId } = req.params as { farmId: string };
    const farmObjectId = getFarmObjectId(farmId);

    await FarmService.deleteMyFarm(userId, farmObjectId);

    sendResponse(res, {
      success: true,
      statusCode: HTTP_STATUS.OK,
      message: "Farm deleted successfully.",
      data: null,
    });
  }
);

export const FarmController = {
  createFarm,
  getMyFarms,
  getMyFarm,
  updateMyFarm,
  deleteMyFarm,
};