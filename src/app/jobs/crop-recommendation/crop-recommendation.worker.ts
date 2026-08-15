import { Job, RedisConnection, Worker } from 'bullmq';
import { QUEUE_NAME } from '../../shared/queue/queue.constant.js';
import type { CropRecommendationJobData } from '../../shared/queue/queue.interface.js';
import { Types } from 'mongoose';
import { logger } from '../../shared/utils/index.js';
import {
  CROP_RECOMMENDATION_STATUS,
  CropRecommendationRepository,
} from '../../modules/crop-recommendations/index.js';
import { aiService } from '../../shared/ai/ai.service.js';

export const cropRecommendationWorker = new Worker(
  QUEUE_NAME.CROP_RECOMMENDATION,
  async (job: Job<CropRecommendationJobData>) => {
    const {
      recommendationId: recommendationIdStr,
      userId: userIdStr,
      profileId: profileIdStr,
      inputParameters,
    } = job.data;

    const recommendationId = new Types.ObjectId(recommendationIdStr);
    const userId = new Types.ObjectId(userIdStr);
    const profileId = new Types.ObjectId(profileIdStr);

    logger.info(
      `[CropRecommendationWorker] Processing job ${job.id} for profile ${profileId.toString()}`
    );

    const processingRecommendation = await CropRecommendationRepository.updateById(
      recommendationId,
      {
        processingStatus: CROP_RECOMMENDATION_STATUS.PROCESSING,
      }
    );

    if (!processingRecommendation) {
      throw new Error(`Crop recommendation not found: ${recommendationId.toString()}`);
    }

    try {
      const aiResult = await aiService.generateCropRecommendation({
        userId: userId.toString(),
        profileId: profileId.toString(),
        inputParameters,
      });

      const completedRecommendation = await CropRecommendationRepository.updateById(
        recommendationId,
        {
          recommendationResult: aiResult.recommendationResult,
          processingStatus: CROP_RECOMMENDATION_STATUS.COMPLETED,
          completedAt: new Date(),
        }
      );

      if (!completedRecommendation) {
        throw new Error(
          `Crop recommendation not found after AI processing: ${recommendationId.toString()}`
        );
      }

      logger.info(
        `[CropRecommendationWorker] Crop recommendation completed for profile ${profileId.toString()}`
      );

      return {
        profileId: profileId.toString(),
        status: CROP_RECOMMENDATION_STATUS.COMPLETED,
      };
    } catch (error: unknown) {
      await CropRecommendationRepository.updateById(recommendationId, {
        processingStatus: CROP_RECOMMENDATION_STATUS.FAILED,
      });

      throw error;
    }
  },
  {
    connection: RedisConnection,
    concurrency: 5,
  }
);

cropRecommendationWorker.on('completed', (job) => {
  logger.info(`[CropRecommendationWorker] Job completed: ${job.id}`);
});

cropRecommendationWorker.on('failed', (job, error) => {
  logger.error(`[CropRecommendationWorker] Job failed: ${job?.id}, Error: ${error}`);
});

cropRecommendationWorker.on('error', (error) => {
  logger.error(`[CropRecommendationWorker] Worker error: ${error}`);
});

cropRecommendationWorker.on('ready', () => {
  logger.info(`[CropRecommendationWorker] Worker is ready to process jobs.`);
});
