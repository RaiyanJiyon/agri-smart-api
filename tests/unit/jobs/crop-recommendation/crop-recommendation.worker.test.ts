/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import type { Job } from 'bullmq';
import type { CropRecommendationJobData } from '../../../../src/app/shared/queue/queue.interface.js';

// Setup BullMQ worker capture using vi.hoisted so variables are defined before hoisting
const { workerProcessorRef, eventHandlers } = vi.hoisted(() => {
  return {
    workerProcessorRef: {
      current: null as unknown as (job: Job<CropRecommendationJobData>) => Promise<unknown>,
    },
    eventHandlers: {},
  };
});

vi.mock('bullmq', () => {
  class MockWorker {
    constructor(
      _queueName: string,
      processor: (job: Job<CropRecommendationJobData>) => Promise<unknown>
    ) {
      workerProcessorRef.current = processor;
    }
    on(event: string, handler: (...args: unknown[]) => void) {
      eventHandlers[event] = handler;
      return this;
    }
  }
  return {
    Worker: MockWorker,
    Queue: vi.fn(),
    RedisConnection: {},
  };
});

vi.mock('../../../../src/app/shared/utils/index.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/crop-recommendations/index.js', () => ({
  CROP_RECOMMENDATION_STATUS: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
  CropRecommendationRepository: {
    updateById: vi.fn(),
  },
}));

vi.mock('../../../../src/app/shared/ai/ai.service.js', () => ({
  aiService: {
    generateCropRecommendation: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/crop-recommendations/crop-recommendation.helper.js', () => ({
  safeSendCropRecommendationNotification: vi.fn(),
}));

import { cropRecommendationWorker } from '../../../../src/app/jobs/crop-recommendation/crop-recommendation.worker.js';
import { CropRecommendationRepository } from '../../../../src/app/modules/crop-recommendations/index.js';
import { aiService } from '../../../../src/app/shared/ai/ai.service.js';
import { safeSendCropRecommendationNotification } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.helper.js';
import { logger } from '../../../../src/app/shared/utils/index.js';

describe('Crop Recommendation Worker', () => {
  const recommendationId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const profileId = new mongoose.Types.ObjectId();

  const mockJobData: CropRecommendationJobData = {
    recommendationId: recommendationId.toString(),
    userId: userId.toString(),
    profileId: profileId.toString(),
    inputParameters: {
      N: 90,
      P: 42,
      K: 43,
      temperature: 20.8,
      humidity: 82.0,
      ph: 6.5,
      rainfall: 202.9,
    },
  };

  const mockJob = {
    id: 'job-123',
    data: mockJobData,
  } as Job<CropRecommendationJobData>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should instantiate worker correctly', () => {
    expect(cropRecommendationWorker).toBeDefined();
    expect(workerProcessorRef.current).toBeDefined();
  });

  it('should successfully process a crop recommendation job', async () => {
    const initialDoc = { _id: recommendationId, processingStatus: 'PROCESSING' };
    const completedDoc = {
      _id: recommendationId,
      processingStatus: 'COMPLETED',
      recommendationResult: { recommendedCrop: 'Rice', confidence: 0.95 },
    };

    vi.mocked(CropRecommendationRepository.updateById)
      .mockResolvedValueOnce(initialDoc as never)
      .mockResolvedValueOnce(completedDoc as never);

    vi.mocked(aiService.generateCropRecommendation).mockResolvedValueOnce({
      recommendationResult: { recommendedCrop: 'Rice', confidence: 0.95 },
    } as never);

    const result = await workerProcessorRef.current(mockJob);

    expect(CropRecommendationRepository.updateById).toHaveBeenNthCalledWith(1, recommendationId, {
      processingStatus: 'PROCESSING',
    });

    expect(aiService.generateCropRecommendation).toHaveBeenCalledWith({
      userId: userId.toString(),
      profileId: profileId.toString(),
      inputParameters: mockJobData.inputParameters,
    });

    expect(CropRecommendationRepository.updateById).toHaveBeenNthCalledWith(2, recommendationId, {
      recommendationResult: { recommendedCrop: 'Rice', confidence: 0.95 },
      processingStatus: 'COMPLETED',
      completedAt: expect.any(Date),
    });

    expect(safeSendCropRecommendationNotification).toHaveBeenCalledWith(userId, completedDoc);

    expect(result).toEqual({
      profileId: profileId.toString(),
      status: 'COMPLETED',
    });
  });

  it('should throw error when recommendation is not found initially', async () => {
    vi.mocked(CropRecommendationRepository.updateById).mockResolvedValueOnce(null);

    await expect(workerProcessorRef.current(mockJob)).rejects.toThrow(
      `Crop recommendation not found: ${recommendationId.toString()}`
    );

    expect(CropRecommendationRepository.updateById).toHaveBeenCalledTimes(1);
    expect(CropRecommendationRepository.updateById).toHaveBeenLastCalledWith(recommendationId, {
      processingStatus: 'PROCESSING',
    });
  });

  it('should throw error and update status to FAILED when AI processing fails', async () => {
    const initialDoc = { _id: recommendationId, processingStatus: 'PROCESSING' };
    vi.mocked(CropRecommendationRepository.updateById).mockResolvedValueOnce(initialDoc as never);
    vi.mocked(aiService.generateCropRecommendation).mockRejectedValueOnce(
      new Error('AI Model Error')
    );

    await expect(workerProcessorRef.current(mockJob)).rejects.toThrow('AI Model Error');

    expect(CropRecommendationRepository.updateById).toHaveBeenLastCalledWith(recommendationId, {
      processingStatus: 'FAILED',
    });
  });

  it('should throw error and update status to FAILED when recommendation is not found after AI processing', async () => {
    const initialDoc = { _id: recommendationId, processingStatus: 'PROCESSING' };

    vi.mocked(CropRecommendationRepository.updateById)
      .mockResolvedValueOnce(initialDoc as never)
      .mockResolvedValueOnce(null);

    vi.mocked(aiService.generateCropRecommendation).mockResolvedValueOnce({
      recommendationResult: { recommendedCrop: 'Wheat' },
    } as never);

    await expect(workerProcessorRef.current(mockJob)).rejects.toThrow(
      `Crop recommendation not found after AI processing: ${recommendationId.toString()}`
    );

    expect(CropRecommendationRepository.updateById).toHaveBeenLastCalledWith(recommendationId, {
      processingStatus: 'FAILED',
    });
  });

  describe('Worker Events', () => {
    it('should handle completed event', () => {
      expect(eventHandlers.completed).toBeDefined();
      eventHandlers.completed?.(mockJob);
      expect(logger.info).toHaveBeenCalledWith(
        `[CropRecommendationWorker] Job completed: ${mockJob.id}`
      );
    });

    it('should handle failed event with job', () => {
      expect(eventHandlers.failed).toBeDefined();
      eventHandlers.failed?.(mockJob, new Error('Something failed'));
      expect(logger.error).toHaveBeenCalledWith(
        `[CropRecommendationWorker] Job failed: ${mockJob.id}, Error: Error: Something failed`
      );
    });

    it('should handle failed event with undefined job', () => {
      expect(eventHandlers.failed).toBeDefined();
      eventHandlers.failed?.(undefined, new Error('Orphan error'));
      expect(logger.error).toHaveBeenCalledWith(
        `[CropRecommendationWorker] Job failed: undefined, Error: Error: Orphan error`
      );
    });

    it('should handle error event', () => {
      expect(eventHandlers.error).toBeDefined();
      eventHandlers.error?.(new Error('Connection dropped'));
      expect(logger.error).toHaveBeenCalledWith(
        `[CropRecommendationWorker] Worker error: Error: Connection dropped`
      );
    });

    it('should handle ready event', () => {
      expect(eventHandlers.ready).toBeDefined();
      eventHandlers.ready?.();
      expect(logger.info).toHaveBeenCalledWith(
        `[CropRecommendationWorker] Worker is ready to process jobs.`
      );
    });
  });
});
