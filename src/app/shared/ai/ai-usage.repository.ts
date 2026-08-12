import type { Types } from 'mongoose';
import type { AIUsage } from './ai-usage.interface.js';
import { AIUsageModel } from './ai-usage.model.js';
import type { AiOperation } from './ai-usage.constant.js';

const create = async (payload: AIUsage): Promise<AIUsage> => {
  const aiUsage = await AIUsageModel.create(payload);

  return aiUsage.toObject();
};

const findByUserId = async (userId: Types.ObjectId): Promise<AIUsage[]> => {
  return AIUsageModel.find({
    userId,
  })
    .sort({ createdAt: -1 })
    .lean<AIUsage[]>();
};

const findRecent = async (limit: number): Promise<AIUsage[]> => {
  return AIUsageModel.find({}).sort({ createdAt: -1 }).limit(limit).lean<AIUsage[]>();
};

const count = async (): Promise<number> => {
  return AIUsageModel.countDocuments();
};

const countByOperation = async (operation: AiOperation): Promise<number> => {
  return AIUsageModel.countDocuments({
    operation,
  });
};

export const AIUsageRepository = {
  create,
  findByUserId,
  findRecent,
  count,
  countByOperation,
};
