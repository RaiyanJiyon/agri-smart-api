import { Types } from 'mongoose';
import { QUEUE_NAME } from '../../shared/queue/queue.constant.js';
import type { DiseaseDetectionJobData } from '../../shared/queue/queue.interface.js';
import { DiseaseDetectionRepository } from '../../modules/disease-detection/disease-detection.repository.js';
import { DISEASE_DETECTION_STATUS } from '../../modules/disease-detection/index.js';
import { aiService } from '../../shared/ai/ai.service.js';
import { safeSendDiseaseDetectionNotification } from '../../modules/disease-detection/disease-detection.helper.js';
import { redisConnection } from '../../shared/queue/queue.connection.js';
import { Worker, type Job } from 'bullmq';
import { logger } from '../../shared/utils/logger.js';
import { config } from '../../shared/config/env.js';
import { ApiError } from '../../shared/errors/ApiError.js';

export const diseaseDetectionWorker = new Worker(
  QUEUE_NAME.DISEASE_DETECTION,
  async (job: Job<DiseaseDetectionJobData>) => {
    const { reportId: reportIdStr, userId: userIdStr, imageUrl } = job.data;

    const reportId = new Types.ObjectId(reportIdStr);
    const userId = new Types.ObjectId(userIdStr);

    logger.info(
      `[DiseaseDetectionWorker] Processing job ${job.id} for report ${reportId.toString()}`
    );

    // Mark report as processing.
    const processingReport = await DiseaseDetectionRepository.updateById(reportId, {
      processingStatus: DISEASE_DETECTION_STATUS.PROCESSING,
    });

    if (!processingReport) {
      throw new ApiError(404, `Disease report not found: ${reportId.toString()}`);
    }

    const ALLOWED_CLOUD_NAME = config.STORAGE.CLOUDINARY_CLOUD_NAME;

    try {
      const parsedUrl = new URL(imageUrl);

      if (
        parsedUrl.protocol !== 'https:' ||
        !parsedUrl.hostname.endsWith('cloudinary.com') ||
        !parsedUrl.pathname.includes(`/${ALLOWED_CLOUD_NAME}/`)
      ) {
        throw new ApiError(403, 'Invalid image URL source detected.');
      }

      const aiResult = await aiService.generateDiseaseDetection({
        userId: userId.toString(),
        imageUrl,
      });

      const completedReport = await DiseaseDetectionRepository.updateById(reportId, {
        diagnosisResult: aiResult.diagnosisResult,
        processingStatus: DISEASE_DETECTION_STATUS.COMPLETED,
        completedAt: new Date(),
      });

      if (!completedReport) {
        throw new ApiError(
          404,
          `Disease report not found after AI processing: ${reportId.toString()}`
        );
      }

      await safeSendDiseaseDetectionNotification(userId, completedReport);

      logger.info(
        `[DiseaseDetectionWorker] Disease detection completed for report ${reportId.toString()}`
      );

      return {
        reportId: reportId.toString(),
        status: DISEASE_DETECTION_STATUS.COMPLETED,
      };
    } catch (error: unknown) {
      await DiseaseDetectionRepository.updateById(reportId, {
        processingStatus: DISEASE_DETECTION_STATUS.FAILED,
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

diseaseDetectionWorker.on('completed', (job) => {
  logger.info(`[DiseaseDetectionWorker] Job completed: ${job.id}`);
});

diseaseDetectionWorker.on('failed', (job, error) => {
  logger.error(`[DiseaseDetectionWorker] Job failed: ${job?.id}`, error);
});

diseaseDetectionWorker.on('error', (error) => {
  logger.error('[DiseaseDetectionWorker] Worker error:', error);
});

diseaseDetectionWorker.on('ready', () => {
  logger.info(`[DiseaseDetectionWorker] Worker connected to Redis.`);
});
