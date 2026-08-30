import { config } from './env.js';

const redisHost = config.REDIS?.REDIS_HOST ?? '127.0.0.1';
const isLocalRedis =
  redisHost === 'localhost' || redisHost === '127.0.0.1' || redisHost === 'redis';

export const redisConnectionOptions = {
  host: redisHost,
  port: config.REDIS?.REDIS_PORT ?? 6379,
  password: config.REDIS?.REDIS_PASSWORD || undefined,
  ...(isLocalRedis
    ? {}
    : {
        tls: {
          rejectUnauthorized: false,
        },
      }),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,
};
