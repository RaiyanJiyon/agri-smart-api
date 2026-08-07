import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export const connectDatabase = async (): Promise<void> => {
  let retries = MAX_RETRIES;
  const mongoUri = config.DB_URL;

  while (retries > 0) {
    try {
      // Added explicit timeout configurations to prevent indefinite connection hangs
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB server can't be reached (5 seconds)
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });
      logger.info('Database connected successfully with Mongoose.');
      return;
    } catch (error) {
      retries -= 1;
      logger.warn(
        `MongoDB connection failed. Retries left: ${retries}. Trying again in ${RETRY_DELAY_MS / 1000}s...`
      );
      logger.error(error as string);

      if (retries === 0) {
        logger.error('Max connection retries reached. Exiting application.');
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};
