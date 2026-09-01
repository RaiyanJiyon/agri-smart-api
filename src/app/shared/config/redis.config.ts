import { config } from './env.js';

let host = config.REDIS?.REDIS_HOST ?? '127.0.0.1';
let port = config.REDIS?.REDIS_PORT ?? 6379;
let password = config.REDIS?.REDIS_PASSWORD ?? undefined;
let isTlsScheme = false;

if (host.startsWith('redis://') || host.startsWith('rediss://')) {
  try {
    const url = new URL(host);
    if (url.protocol === 'rediss:') {
      isTlsScheme = true;
    }
    host = url.hostname;
    if (url.port) {
      port = Number(url.port);
    }
    if (url.password) {
      password = decodeURIComponent(url.password);
    }
  } catch {
    // Keep fallback host if URL parsing fails
  }
}

const isLocalRedis =
  host === 'localhost' || host === '127.0.0.1' || host === 'redis';

export const redisConnectionOptions = {
  host,
  port,
  ...(password ? { password } : {}),
  ...(!isLocalRedis || isTlsScheme
    ? {
        tls: {
          rejectUnauthorized: false,
        },
      }
    : {}),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,
};

