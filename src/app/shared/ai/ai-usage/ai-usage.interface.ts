import type { Types } from 'mongoose';
import type { AI_EXECUTION_STATUS, AI_OPERATION } from './ai-usage.constant.js';

export type AiOperation = (typeof AI_OPERATION)[keyof typeof AI_OPERATION];

export type AiExecutionStatus = (typeof AI_EXECUTION_STATUS)[keyof typeof AI_EXECUTION_STATUS];

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
