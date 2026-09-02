import type { Types } from 'mongoose';
import type { AIUsage, AIUsageStatistics } from './ai-usage.interface.js';
import { AIUsageModel } from './ai-usage.model.js';
import { AI_EXECUTION_STATUS, AI_OPERATION, type AiOperation } from './ai-usage.constant.js';

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

const getStatistics = async (): Promise<AIUsageStatistics> => {
  const [
    totalRequests,
    successfulRequests,
    failedRequests,
    chatRequests,
    cropRecommendationRequests,
    diseaseDetectionRequests,
    tokenStats,
    latencyStats,
  ] = await Promise.all([
    AIUsageModel.countDocuments(),

    AIUsageModel.countDocuments({
      status: AI_EXECUTION_STATUS.SUCCESS,
    }),

    AIUsageModel.countDocuments({
      status: AI_EXECUTION_STATUS.FAILED,
    }),

    AIUsageModel.countDocuments({
      operation: AI_OPERATION.CHAT,
    }),

    AIUsageModel.countDocuments({
      operation: AI_OPERATION.CROP_RECOMMENDATION,
    }),

    AIUsageModel.countDocuments({
      operation: AI_OPERATION.DISEASE_DETECTION,
    }),

    AIUsageModel.aggregate<{ totalTokens: number }>([
      {
        $group: {
          _id: null,
          totalTokens: {
            $sum: {
              $ifNull: ['$totalTokens', 0],
            },
          },
        },
      },
    ]),

    AIUsageModel.aggregate<{ averageLatencyMs: number }>([
      {
        $group: {
          _id: null,
          averageLatencyMs: {
            $avg: '$latencyMs',
          },
        },
      },
    ]),
  ]);

  return {
    totalRequests,

    successfulRequests,

    failedRequests,

    totalTokens: tokenStats[0]?.totalTokens ?? 0,

    averageLatencyMs: Math.round(latencyStats[0]?.averageLatencyMs ?? 0),

    byOperation: {
      chat: chatRequests,
      cropRecommendation: cropRecommendationRequests,
      diseaseDetection: diseaseDetectionRequests,
    },
  };
};

export const AIUsageRepository = {
  create,
  findByUserId,
  findRecent,
  count,
  countByOperation,
  getStatistics,
};
