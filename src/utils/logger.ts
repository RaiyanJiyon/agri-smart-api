import winston from 'winston';
import { envVars } from '../config/env.js';

const winstonLogger = winston.createLogger({
  level: envVars.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Enterprise standard: structured JSON logs
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple() // Human-readable for local development
      ),
    }),
  ],
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
