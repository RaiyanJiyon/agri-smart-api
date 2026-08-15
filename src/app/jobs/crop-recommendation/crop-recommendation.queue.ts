import { Queue, RedisConnection } from 'bullmq';
import type { CropRecommendationJobData } from '../../shared/queue/queue.interface.js';
import { QUEUE_NAME } from '../../shared/queue/queue.constant.js';

export const cropRecommendationQueue = new Queue<CropRecommendationJobData>(
  QUEUE_NAME.CROP_RECOMMENDATION,
  {
    connection: RedisConnection,
  }
);

export const addCropRecommendationJob = async (data: CropRecommendationJobData) => {
  return cropRecommendationQueue.add(QUEUE_NAME.CROP_RECOMMENDATION, data, {
    attempts: 3,

    backoff: {
      type: 'exponential',
      delay: 2000,
    },

    removeOnComplete: {
      age: 60 * 60,
      count: 1000,
    },

    removeOnFail: {
      age: 24 * 60 * 60,
    },
  });
};
