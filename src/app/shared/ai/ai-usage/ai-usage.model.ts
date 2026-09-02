import { model, Schema } from 'mongoose';
import type { AIUsage } from './ai-usage.interface.js';
import { COLLECTION_NAME } from '../../constants/index.js';
import { AI_EXECUTION_STATUS, AI_OPERATION } from './ai-usage.constant.js';

const aiUsageSchema = new Schema<AIUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      required: true,
      index: true,
    },

    operation: {
      type: String,
      enum: Object.values(AI_OPERATION),
      required: true,
      index: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(AI_EXECUTION_STATUS),
      required: true,
      index: true,
    },

    latencyMs: {
      type: Number,
      required: true,
      min: 0,
    },

    promptTokens: {
      type: Number,
      min: 0,
    },

    completionTokens: {
      type: Number,
      min: 0,
    },

    totalTokens: {
      type: Number,
      min: 0,
    },

    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

aiUsageSchema.index({
  userId: 1,
  createdAt: -1,
});

aiUsageSchema.index({
  operation: 1,
  createdAt: -1,
});

export const AIUsageModel = model<AIUsage>(COLLECTION_NAME.AI_USAGE, aiUsageSchema);
