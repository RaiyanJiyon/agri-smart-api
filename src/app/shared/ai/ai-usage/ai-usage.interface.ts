import type { Types } from 'mongoose';
import type { AiExecutionStatus, AiOperation } from './ai-usage.constant.js';

export interface AIUsage {
  userId: Types.ObjectId;

  operation: AiOperation;

  model: string;

  status: AiExecutionStatus;

  latencyMs: number;

  promptTokens?: number;

  completionTokens?: number;

  totalTokens?: number;

  errorMessage?: string;

  createdAt?: Date;

  updatedAt?: Date;
}

export interface AIUsageStatistics {
  totalRequests: number;

  successfulRequests: number;

  failedRequests: number;

  totalTokens: number;

  averageLatencyMs: number;

  byOperation: {
    chat: number;
    cropRecommendation: number;
    diseaseDetection: number;
  };
}
