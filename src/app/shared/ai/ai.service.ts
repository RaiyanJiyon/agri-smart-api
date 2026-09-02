import { Types } from 'mongoose';
import { MistralService } from '../integrations/mistral/mistral.service.js';
import { AI_EXECUTION_STATUS, AI_OPERATION } from './ai-usage/ai-usage.constant.js';
import { AIUsageService } from './ai-usage/ai-usage.service.js';

import type {
  AIChatInput,
  AIChatOutput,
  AIService,
  CropRecommendationAIInput,
  CropRecommendationAIOutput,
  DiseaseDetectionAIInput,
  DiseaseDetectionAIOutput,
} from './ai.interface.js';
import { config } from '../config/env.js';

class AIServiceImpl implements AIService {
  async generateCropRecommendation(
    input: CropRecommendationAIInput
  ): Promise<CropRecommendationAIOutput> {
    const startedAt = Date.now();

    try {
      const result = await MistralService.generateCropRecommendation({
        profileId: input.profileId,
        inputParameters: input.inputParameters,
      });

      await AIUsageService.record({
        userId: new Types.ObjectId(input.userId),
        operation: AI_OPERATION.CROP_RECOMMENDATION,
        model: config.AI.MISTRAL_MODEL,
        status: AI_EXECUTION_STATUS.SUCCESS,
        latencyMs: Date.now() - startedAt,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      });

      return {
        recommendationResult: {
          recommendedCrops: result.recommendedCrops,
          explanation: result.explanation,
          confidence: result.confidence,
        },
      };
    } catch (error) {
      await AIUsageService.record({
        userId: new Types.ObjectId(input.userId),
        operation: AI_OPERATION.CROP_RECOMMENDATION,
        model: config.AI.MISTRAL_MODEL,
        status: AI_EXECUTION_STATUS.FAILED,
        latencyMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error.',
      });

      throw error;
    }
  }

  async generateDiseaseDetection(
    input: DiseaseDetectionAIInput
  ): Promise<DiseaseDetectionAIOutput> {
    const startedAt = Date.now();

    try {
      const result = await MistralService.generateDiseaseDetection({
        imageUrl: input.imageUrl,
      });

      await AIUsageService.record({
        userId: new Types.ObjectId(input.userId),
        operation: AI_OPERATION.DISEASE_DETECTION,
        model: config.AI.MISTRAL_MODEL,
        status: AI_EXECUTION_STATUS.SUCCESS,
        latencyMs: Date.now() - startedAt,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      });

      return {
        diagnosisResult: {
          disease: result.disease,
          explanation: result.explanation,
          recommendedActions: result.recommendedActions,
          confidence: result.confidence,
        },
      };
    } catch (error) {
      await AIUsageService.record({
        userId: new Types.ObjectId(input.userId),
        operation: AI_OPERATION.DISEASE_DETECTION,
        model: config.AI.MISTRAL_MODEL,
        status: AI_EXECUTION_STATUS.FAILED,
        latencyMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error.',
      });

      throw error;
    }
  }

  async generateChatResponse(input: AIChatInput): Promise<AIChatOutput> {
    const startedAt = Date.now();

    try {
      const result = await MistralService.generateChatResponse({
        message: input.message,
        conversationHistory: input.conversationHistory,
      });

      await AIUsageService.record({
        userId: new Types.ObjectId(input.userId),
        operation: AI_OPERATION.CHAT,
        model: config.AI.MISTRAL_MODEL,
        status: AI_EXECUTION_STATUS.SUCCESS,
        latencyMs: Date.now() - startedAt,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      });

      return {
        message: result.message,
      };
    } catch (error) {
      await AIUsageService.record({
        userId: new Types.ObjectId(input.userId),
        operation: AI_OPERATION.CHAT,
        model: config.AI.MISTRAL_MODEL,
        status: AI_EXECUTION_STATUS.FAILED,
        latencyMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error.',
      });

      throw error;
    }
  }
}

export const aiService = new AIServiceImpl();
