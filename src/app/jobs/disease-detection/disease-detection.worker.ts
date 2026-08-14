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

export const diseaseDetectionWorker = new Worker(
  QUEUE_NAME.DISEASE_DETECTION,
  async (job: Job<DiseaseDetectionJobData>) => {
    const { userId, imageUrl } = job.data;

    const reportId = new Types.ObjectId(job.data.reportId);

    // Mark report as processing.
    const processingReport = await DiseaseDetectionRepository.updateById(reportId, {
      processingStatus: DISEASE_DETECTION_STATUS.PROCESSING,
    });

    if (!processingReport) {
      throw new Error(`Disease report not found: ${reportId.toString()}`);
    }

    try {
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
        throw new Error(`Disease report not found after AI processing: ${reportId.toString()}`);
      }

      await safeSendDiseaseDetectionNotification(userId, completedReport);

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
