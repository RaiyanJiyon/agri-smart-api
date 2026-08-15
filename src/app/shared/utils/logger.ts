import winston from 'winston';
import { config } from '../config/env.js';

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      config.NODE_ENV === 'production'
        ? winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
        : winston.format.colorize({ all: true }),
      winston.format.simple()
    ),
  }),
];

const winstonLogger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports,
});

class Logger {
  public info(message: string, meta?: unknown): void {
    winstonLogger.info(message, { meta });
  }

  public warn(message: string, meta?: unknown): void {
    winstonLogger.warn(message, { meta });
  }

  public error(message: string, meta?: unknown): void {
    winstonLogger.error(message, { meta });
  }

  public debug(message: string, meta?: unknown): void {
    winstonLogger.debug(message, { meta });
  }
}

export const logger = new Logger();
