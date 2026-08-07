import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './app/shared/config/database.js';
import { logger } from './app/shared/utils/logger.js';

const PORT = Number(process.env.PORT ?? 5000);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port http://localhost:${PORT}`);
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
    }, 10000).unref(); // Adding .unref() lets Node.js exit immediately if cleanup finishes early
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
