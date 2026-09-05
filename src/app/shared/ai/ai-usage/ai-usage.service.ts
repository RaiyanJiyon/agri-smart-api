import type { Types } from 'mongoose';
import type { AiOperation, AIUsage, AIUsageStatistics } from './ai-usage.interface.js';
import { AIUsageRepository } from './ai-usage.repository.js';

const record = async (payload: AIUsage): Promise<AIUsage> => {
  return AIUsageRepository.create(payload);
};

const getByUserId = async (userId: Types.ObjectId): Promise<AIUsage[]> => {
  return AIUsageRepository.findByUserId(userId);
};

const getRecent = async (limit: number): Promise<AIUsage[]> => {
  return AIUsageRepository.findRecent(limit);
};

const getTotalCount = async (): Promise<number> => {
  return AIUsageRepository.count();
};

const getCountByOperation = async (operation: AiOperation): Promise<number> => {
  return AIUsageRepository.countByOperation(operation);
};

const getStatistics = async (): Promise<AIUsageStatistics> => {
  return AIUsageRepository.getStatistics();
};

export const AIUsageService = {
  record,
  getByUserId,
  getRecent,
  getTotalCount,
  getCountByOperation,
  getStatistics,
};
