/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import type { Job } from 'bullmq';
import type { DiseaseDetectionJobData } from '../../../../src/app/shared/queue/queue.interface.js';

const { workerProcessorRef, eventHandlers } = vi.hoisted(() => {
  return {
    workerProcessorRef: {
      current: null as unknown as (job: Job<DiseaseDetectionJobData>) => Promise<unknown>,
    },
    eventHandlers: {},
  };
});

vi.mock('bullmq', () => {
  class MockWorker {
    constructor(
      _queueName: string,
      processor: (job: Job<DiseaseDetectionJobData>) => Promise<unknown>
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

vi.mock('../../../../src/app/shared/queue/queue.connection.js', () => ({
  redisConnection: {},
}));

vi.mock('../../../../src/app/shared/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../../src/app/shared/config/env.js', () => ({
  config: {
    STORAGE: {
      CLOUDINARY_CLOUD_NAME: 'test_cloud',
    },
  },
}));

vi.mock('../../../../src/app/modules/disease-detection/index.js', () => ({
  DISEASE_DETECTION_STATUS: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
}));

vi.mock('../../../../src/app/modules/disease-detection/disease-detection.repository.js', () => ({
  DiseaseDetectionRepository: {
    updateById: vi.fn(),
  },
}));

vi.mock('../../../../src/app/shared/ai/ai.service.js', () => ({
  aiService: {
    generateDiseaseDetection: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/disease-detection/disease-detection.helper.js', () => ({
  safeSendDiseaseDetectionNotification: vi.fn(),
}));

vi.mock('../../../../src/app/shared/integrations/storage/cloudinary.service.js', () => ({
  CloudinaryService: {
    deleteImage: vi.fn(),
  },
}));

import { diseaseDetectionWorker } from '../../../../src/app/jobs/disease-detection/disease-detection.worker.js';
import { DiseaseDetectionRepository } from '../../../../src/app/modules/disease-detection/disease-detection.repository.js';
import { aiService } from '../../../../src/app/shared/ai/ai.service.js';
import { safeSendDiseaseDetectionNotification } from '../../../../src/app/modules/disease-detection/disease-detection.helper.js';
import { CloudinaryService } from '../../../../src/app/shared/integrations/storage/cloudinary.service.js';
import { logger } from '../../../../src/app/shared/utils/logger.js';

describe('Disease Detection Worker', () => {
  const reportId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const profileId = new mongoose.Types.ObjectId();
  const validImageUrl = 'https://res.cloudinary.com/test_cloud/image/upload/v12345/sample.jpg';

  const mockJobData: DiseaseDetectionJobData = {
    reportId: reportId.toString(),
    profileId: profileId.toString(),
    userId: userId.toString(),
    imageUrl: validImageUrl,
    imagePublicId: 'disease-detection/sample',
  };

  const mockJob = {
    id: 'job-456',
    data: mockJobData,
    opts: { attempts: 3 },
    attemptsMade: 1,
  } as unknown as Job<DiseaseDetectionJobData>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should instantiate disease detection worker', () => {
    expect(diseaseDetectionWorker).toBeDefined();
    expect(workerProcessorRef.current).toBeDefined();
  });

  it('should successfully process a disease detection job', async () => {
    const initialReport = { _id: reportId, processingStatus: 'PROCESSING' };
    const completedReport = {
      _id: reportId,
      processingStatus: 'COMPLETED',
      diagnosisResult: { diseaseName: 'Leaf Spot', confidence: 0.98 },
    };

    vi.mocked(DiseaseDetectionRepository.updateById)
      .mockResolvedValueOnce(initialReport as never)
      .mockResolvedValueOnce(completedReport as never);

    vi.mocked(aiService.generateDiseaseDetection).mockResolvedValueOnce({
      diagnosisResult: { diseaseName: 'Leaf Spot', confidence: 0.98 },
    } as never);

    const result = await workerProcessorRef.current(mockJob);

    expect(DiseaseDetectionRepository.updateById).toHaveBeenNthCalledWith(1, reportId, {
      processingStatus: 'PROCESSING',
    });

    expect(aiService.generateDiseaseDetection).toHaveBeenCalledWith({
      userId: userId.toString(),
      imageUrl: validImageUrl,
    });

    expect(DiseaseDetectionRepository.updateById).toHaveBeenNthCalledWith(2, reportId, {
      diagnosisResult: { diseaseName: 'Leaf Spot', confidence: 0.98 },
      processingStatus: 'COMPLETED',
      completedAt: expect.any(Date),
    });

    expect(safeSendDiseaseDetectionNotification).toHaveBeenCalledWith(userId, completedReport);

    expect(result).toEqual({
      reportId: reportId.toString(),
      status: 'COMPLETED',
    });
  });

  it('should throw ApiError 404 when disease report is not found initially', async () => {
    vi.mocked(DiseaseDetectionRepository.updateById).mockResolvedValueOnce(null);

    await expect(workerProcessorRef.current(mockJob)).rejects.toThrow(
      `Disease report not found: ${reportId.toString()}`
    );

    expect(DiseaseDetectionRepository.updateById).toHaveBeenCalledTimes(1);
    expect(DiseaseDetectionRepository.updateById).toHaveBeenLastCalledWith(reportId, {
      processingStatus: 'PROCESSING',
    });
  });

  it('should throw ApiError 403 and set status FAILED for invalid image URL source', async () => {
    const invalidJob = {
      ...mockJob,
      data: {
        ...mockJobData,
        imageUrl: 'https://malicious.com/test_cloud/image.jpg',
      },
    } as unknown as Job<DiseaseDetectionJobData>;

    const initialReport = { _id: reportId, processingStatus: 'PROCESSING' };
    vi.mocked(DiseaseDetectionRepository.updateById).mockResolvedValueOnce(initialReport as never);

    await expect(workerProcessorRef.current(invalidJob)).rejects.toThrow(
      'Invalid image URL source detected.'
    );

    expect(DiseaseDetectionRepository.updateById).toHaveBeenLastCalledWith(reportId, {
      processingStatus: 'FAILED',
    });
  });

  it('should throw error and update status to FAILED when AI processing fails', async () => {
    const initialReport = { _id: reportId, processingStatus: 'PROCESSING' };
    vi.mocked(DiseaseDetectionRepository.updateById).mockResolvedValueOnce(initialReport as never);

    vi.mocked(aiService.generateDiseaseDetection).mockRejectedValueOnce(
      new Error('AI Model Timeout')
    );

    await expect(workerProcessorRef.current(mockJob)).rejects.toThrow('AI Model Timeout');

    expect(DiseaseDetectionRepository.updateById).toHaveBeenLastCalledWith(reportId, {
      processingStatus: 'FAILED',
    });
  });

  it('should throw ApiError 404 and set status FAILED when report is not found after AI processing', async () => {
    const initialReport = { _id: reportId, processingStatus: 'PROCESSING' };

    vi.mocked(DiseaseDetectionRepository.updateById)
      .mockResolvedValueOnce(initialReport as never)
      .mockResolvedValueOnce(null);

    vi.mocked(aiService.generateDiseaseDetection).mockResolvedValueOnce({
      diagnosisResult: { diseaseName: 'Rust' },
    } as never);

    await expect(workerProcessorRef.current(mockJob)).rejects.toThrow(
      `Disease report not found after AI processing: ${reportId.toString()}`
    );

    expect(DiseaseDetectionRepository.updateById).toHaveBeenLastCalledWith(reportId, {
      processingStatus: 'FAILED',
    });
  });

  describe('Worker Events', () => {
    it('should handle completed event', () => {
      expect(eventHandlers.completed).toBeDefined();
      eventHandlers.completed?.(mockJob);
      expect(logger.info).toHaveBeenCalledWith(
        `[DiseaseDetectionWorker] Job completed: ${mockJob.id}`
      );
    });

    it('should handle failed event with undefined job', () => {
      expect(eventHandlers.failed).toBeDefined();
      eventHandlers.failed?.(undefined, new Error('Orphan fail'));
      expect(logger.error).toHaveBeenCalledWith(
        '[DiseaseDetectionWorker] Job failed: undefined',
        expect.any(Error)
      );
    });

    it('should handle failed event when attempts attempt limit is not reached', () => {
      expect(eventHandlers.failed).toBeDefined();
      const retryableJob = {
        id: 'job-retry',
        opts: { attempts: 3 },
        attemptsMade: 1,
        data: { imagePublicId: 'sample-public-id' },
      };

      eventHandlers.failed?.(retryableJob, new Error('Temporary error'));

      expect(CloudinaryService.deleteImage).not.toHaveBeenCalled();
    });

    it('should clean up Cloudinary image when job permanently fails (attempts >= maxAttempts)', async () => {
      expect(eventHandlers.failed).toBeDefined();
      vi.mocked(CloudinaryService.deleteImage).mockResolvedValueOnce(undefined);

      const permFailedJob = {
        id: 'job-perm-fail',
        opts: { attempts: 3 },
        attemptsMade: 3,
        data: { imagePublicId: 'disease-detection/perm-fail' },
      };

      eventHandlers.failed?.(permFailedJob, new Error('Permanent failure'));

      // Wait a tick for the void async function to execute
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith('disease-detection/perm-fail');
      expect(logger.info).toHaveBeenCalledWith(
        '[DiseaseDetectionWorker] Cleaned up Cloudinary image (disease-detection/perm-fail) for permanently failed job job-perm-fail.'
      );
    });

    it('should handle Cloudinary cleanup error gracefully when job permanently fails', async () => {
      expect(eventHandlers.failed).toBeDefined();
      vi.mocked(CloudinaryService.deleteImage).mockRejectedValueOnce(
        new Error('Cloudinary API Error')
      );

      const permFailedJob = {
        id: 'job-perm-fail-err',
        opts: { attempts: 1 },
        attemptsMade: 1,
        data: { imagePublicId: 'disease-detection/cleanup-err' },
      };

      eventHandlers.failed?.(permFailedJob, new Error('Permanent error'));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith('disease-detection/cleanup-err');
      expect(logger.error).toHaveBeenCalledWith(
        '[DiseaseDetectionWorker] Failed to clean up Cloudinary image for job job-perm-fail-err:',
        expect.any(Error)
      );
    });

    it('should fallback to 1 maxAttempt when job.opts.attempts is undefined', async () => {
      expect(eventHandlers.failed).toBeDefined();
      vi.mocked(CloudinaryService.deleteImage).mockResolvedValueOnce(undefined);

      const noOptsJob = {
        id: 'job-no-attempts',
        opts: {},
        attemptsMade: 1,
        data: { imagePublicId: 'disease-detection/no-attempts' },
      };

      eventHandlers.failed?.(noOptsJob, new Error('Fallback attempt error'));

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith('disease-detection/no-attempts');
    });

    it('should handle error event', () => {
      expect(eventHandlers.error).toBeDefined();
      eventHandlers.error?.(new Error('Redis crash'));
      expect(logger.error).toHaveBeenCalledWith(
        '[DiseaseDetectionWorker] Worker error:',
        expect.any(Error)
      );
    });

    it('should handle ready event', () => {
      expect(eventHandlers.ready).toBeDefined();
      eventHandlers.ready?.();
      expect(logger.info).toHaveBeenCalledWith(
        '[DiseaseDetectionWorker] Worker connected to Redis.'
      );
    });
  });
});
