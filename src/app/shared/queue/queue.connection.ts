import { Redis } from 'ioredis';
import { config } from '../config/env.js';

export const redisConnection = new Redis({
  host: config.REDIS.REDIS_HOST ?? '127.0.0.1',
  port: config.REDIS.REDIS_PORT ?? 6379,
  ...(config.REDIS.REDIS_PASSWORD && { password: config.REDIS.REDIS_PASSWORD }),
  maxRetriesPerRequest: null,
});
