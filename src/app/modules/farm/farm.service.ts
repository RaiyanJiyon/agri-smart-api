import type { Types } from 'mongoose';
import type { CreateFarmBody, Farm, UpdateFarmBody } from './farm.interface.js';
import { FarmRepository } from './farm.repository.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

const createFarm = async (userId: Types.ObjectId, payload: CreateFarmBody): Promise<Farm> => {
  return FarmRepository.create({
    userId,
    ...payload,
  });
};

const getMyFarms = async (userId: Types.ObjectId): Promise<Farm[]> => {
  return FarmRepository.findAllByUserId(userId);
};

const getMyFarm = async (userId: Types.ObjectId, farmId: Types.ObjectId): Promise<Farm> => {
  const farm = await FarmRepository.findByIdAndUserId(farmId, userId);

  if (!farm) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Farm not found.');
  }

  return farm;
};

const updateMyFarm = async (
  userId: Types.ObjectId,
  farmId: Types.ObjectId,
  payload: UpdateFarmBody
): Promise<Farm> => {
  const farm = await FarmRepository.updateByIdAndUserId(farmId, userId, payload);

  if (!farm) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Farm not found.');
  }

  return farm;
};

const deleteMyFarm = async (userId: Types.ObjectId, farmId: Types.ObjectId): Promise<void> => {
  const farm = await FarmRepository.deleteByIdAndUserId(farmId, userId);

  if (!farm) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Farm not found.');
  }
};

export const FarmService = {
  createFarm,
  getMyFarms,
  getMyFarm,
  updateMyFarm,
  deleteMyFarm,
};
