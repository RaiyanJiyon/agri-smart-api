import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });

  const handleShutdown = (signal: string): void => {
    logger.info(`\nReceived ${signal}. Shutting down gracefully...`);

    server.close(() => {
      logger.info('HTTP server closed.');

      mongoose.connection
        .close(false)
        .then(() => {
          logger.info('MongoDB connection closed.');
          process.exit(0);
        })
        .catch((err) => {
          logger.error('Error during MongoDB disconnection:', err);
          process.exit(1);
        });
    });

    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => {
    void handleShutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void handleShutdown('SIGINT');
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
