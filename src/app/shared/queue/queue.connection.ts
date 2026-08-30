import { Redis } from 'ioredis';
import { redisConnectionOptions } from '../config/redis.config.js';
import { logger } from '../utils/logger.js';

export const redisConnection = new Redis(redisConnectionOptions);

redisConnection.on('error', (err) => {
  logger.warn(`[RedisConnection] Redis connection error: ${err.message}`);
});
