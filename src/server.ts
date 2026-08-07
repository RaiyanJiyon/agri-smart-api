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

  // Handle termination signals for graceful shutdown (e.g., from Docker or Kubernetes)
  process.on('SIGTERM', () => {
    void handleShutdown('SIGTERM');
  });

  // Handle SIGINT (e.g., Ctrl+C) for graceful shutdown
  process.on('SIGINT', () => {
    void handleShutdown('SIGINT');
  });

  // Handle unhandled promise rejections (e.g., background async tasks without .catch)
  process.on('unhandledRejection', (reason: Error) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', reason);
    handleShutdown('unhandledRejection');
  });

  // Handle uncaught synchronous exceptions (e.g., programming errors)
  process.on('uncaughtException', (err: Error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
    // Uncaught exceptions leave the app in an unclean state, so exit immediately
    process.exit(1);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
