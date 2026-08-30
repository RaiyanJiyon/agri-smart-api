import { Queue } from 'bullmq';
import type { DiseaseDetectionJobData } from '../../shared/queue/queue.interface.js';
import { JOB_NAME, QUEUE_NAME } from '../../shared/queue/queue.constant.js';
import { redisConnectionOptions } from '../../shared/config/redis.config.js';

export const diseaseDetectionQueue = new Queue<DiseaseDetectionJobData>(
  QUEUE_NAME.DISEASE_DETECTION,
  {
    connection: redisConnectionOptions,
  }
);

export const addDiseaseDetectionJob = async (data: DiseaseDetectionJobData) => {
  return diseaseDetectionQueue.add(JOB_NAME.DISEASE_DETECTION, data, {
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
