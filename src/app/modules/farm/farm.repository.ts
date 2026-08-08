import type { ClientSession, Types } from 'mongoose';
import type { Farm } from './farm.interface.js';
import { FarmModel } from './farm.model.js';

const create = async (payload: Farm, session: ClientSession): Promise<Farm> => {
  const [farm] = await FarmModel.create([payload], { session });

  return farm!;
};

const findAllByUserId = async (userId: Types.ObjectId): Promise<Farm[]> => {
  return FarmModel.find({
    userId: userId,
  }).sort({ createdAt: -1 });
};

const findByIdAndUserId = async (
  farmId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Farm | null> => {
  return FarmModel.findOne({
    _id: farmId,
    userId: userId,
  });
};

const updateByIdAndUserId = async (
  farmId: Types.ObjectId,
  userId: Types.ObjectId,
  payload: Partial<Farm>
): Promise<Farm | null> => {
  return FarmModel.findOneAndUpdate(
    {
      _id: farmId,
      userId: userId,
    },
    {
      $set: payload,
    },
    {
      runValidators: true,
      new: true,
    }
  );
};

const deleteByIdAndUserId = async (farmId: Types.ObjectId, userId: Types.ObjectId) => {
  return FarmModel.findOneAndDelete({
    _id: farmId,
    userId: userId,
  });
};

export const FarmRepository = {
  create,
  findAllByUserId,
  findByIdAndUserId,
  updateByIdAndUserId,
  deleteByIdAndUserId,
};
