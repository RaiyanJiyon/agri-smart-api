import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { aiService } from '../../../../src/app/shared/ai/ai.service.js';
import { AI_EXECUTION_STATUS, AIUsageService } from '../../../../src/app/shared/ai/index.js';
import { MistralService } from '../../../../src/app/shared/integrations/mistral/mistral.service.js';

vi.mock('../../../../src/app/shared/integrations/mistral/mistral.service.js', () => ({
  MistralService: {
    generateCropRecommendation: vi.fn(),
    generateDiseaseDetection: vi.fn(),
    generateChatResponse: vi.fn(),
  },
}));

vi.mock('../../../../src/app/shared/ai/ai-usage/ai-usage.service.js', () => ({
  AIUsageService: {
    record: vi.fn(),
  },
}));

describe('AIService', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const profileId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCropRecommendation', () => {
    it('should generate crop recommendation successfully and record usage', async () => {
      vi.mocked(MistralService.generateCropRecommendation).mockResolvedValueOnce({
        recommendedCrops: ['Rice'],
        explanation: 'Good soil',
        confidence: 0.95,
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      });

      const output = await aiService.generateCropRecommendation({
        userId,
        profileId,
        inputParameters: {
          location: 'Dhaka, Bangladesh',
          fieldArea: 2,
          soilType: 'Loamy',
          soilPh: 6.5,
          nitrogen: 90,
          phosphorus: 40,
          potassium: 40,
          averageTemperature: 25,
          annualRainfall: 200,
        },
      });

      expect(output.recommendationResult.recommendedCrops[0]).toBe('Rice');

      expect(AIUsageService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AI_EXECUTION_STATUS.SUCCESS,
          totalTokens: 30,
        })
      );
    });

    it('should record failure and throw error when MistralService fails', async () => {
      vi.mocked(MistralService.generateCropRecommendation).mockRejectedValueOnce(
        new Error('AI API rate limited')
      );

      await expect(
        aiService.generateCropRecommendation({
          userId,
          profileId,
          inputParameters: {
            location: 'Dhaka, Bangladesh',
            fieldArea: 2,
            soilType: 'Loamy',
            soilPh: 6.5,
            nitrogen: 90,
            phosphorus: 40,
            potassium: 40,
            averageTemperature: 25,
            annualRainfall: 200,
          },
        })
      ).rejects.toThrow('AI API rate limited');

      expect(AIUsageService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AI_EXECUTION_STATUS.FAILED,
          errorMessage: 'AI API rate limited',
        })
      );
    });
  });

  describe('generateDiseaseDetection', () => {
    it('should generate disease detection diagnosis successfully and record usage', async () => {
      vi.mocked(MistralService.generateDiseaseDetection).mockResolvedValueOnce({
        disease: 'Late Blight',
        explanation: 'Fungal infection detected',
        recommendedActions: ['Apply fungicide'],
        confidence: 0.92,
        usage: {
          promptTokens: 15,
          completionTokens: 25,
          totalTokens: 40,
        },
      });

      const output = await aiService.generateDiseaseDetection({
        userId,
        imageUrl: 'https://res.cloudinary.com/test/image.jpg',
      });

      expect(output.diagnosisResult.disease).toBe('Late Blight');

      expect(AIUsageService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AI_EXECUTION_STATUS.SUCCESS,
          totalTokens: 40,
        })
      );
    });

    it('should record failure when disease detection throws non-Error object', async () => {
      vi.mocked(MistralService.generateDiseaseDetection).mockRejectedValueOnce('String exception');

      await expect(
        aiService.generateDiseaseDetection({
          userId,
          imageUrl: 'https://res.cloudinary.com/test/image.jpg',
        })
      ).rejects.toBe('String exception');

      expect(AIUsageService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AI_EXECUTION_STATUS.FAILED,
          errorMessage: 'Unknown AI error.',
        })
      );
    });
  });

  describe('generateChatResponse', () => {
    it('should generate chat response successfully and record usage', async () => {
      vi.mocked(MistralService.generateChatResponse).mockResolvedValueOnce({
        message: 'Tomato plants require 1-2 inches of water per week.',
        usage: {
          promptTokens: 5,
          completionTokens: 15,
          totalTokens: 20,
        },
      });

      const output = await aiService.generateChatResponse({
        userId,
        conversationId: new mongoose.Types.ObjectId().toString(),
        message: 'How much water do tomatoes need?',
        conversationHistory: [],
      });

      expect(output.message).toContain('Tomato plants');

      expect(AIUsageService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AI_EXECUTION_STATUS.SUCCESS,
          totalTokens: 20,
        })
      );
    });

    it('should record failure and throw error when chat response fails', async () => {
      vi.mocked(MistralService.generateChatResponse).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        aiService.generateChatResponse({
          userId,
          conversationId: new mongoose.Types.ObjectId().toString(),
          message: 'How much water do tomatoes need?',
          conversationHistory: [],
        })
      ).rejects.toThrow('Network error');

      expect(AIUsageService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AI_EXECUTION_STATUS.FAILED,
          errorMessage: 'Network error',
        })
      );
    });
  });
});
