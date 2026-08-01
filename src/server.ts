import express from 'express';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database.js';

const app = express();
const PORT = Number(process.env.PORT ?? 5000);

const startServer = async (): Promise<void> => {
    await connectDatabase();

    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    const handleShutdown = (signal: string): void => {
        console.log(`\nReceived ${signal}. Shutting down gracefully...`);

        server.close(() => {
            console.log('HTTP server closed.');

            mongoose.connection.close(false)
                .then(() => {
                    console.log('MongoDB connection closed.');
                    process.exit(0);
                })
                .catch((err) => {
                    console.error('Error during MongoDB disconnection:', err);
                    process.exit(1);
                });
        });

        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => { void handleShutdown('SIGTERM'); });
    process.on('SIGINT', () => { void handleShutdown('SIGINT'); });
};

startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});