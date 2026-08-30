import { config } from './env.js';

export const redisConnectionOptions = {
  host: config.REDIS.REDIS_HOST,
  port: config.REDIS.REDIS_PORT,
  password: config.REDIS.REDIS_PASSWORD ?? undefined,
};
