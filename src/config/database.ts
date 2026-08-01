import mongoose from "mongoose";
import { envVars } from "./env.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export const connectDatabase = async (): Promise<void> => {
    let retries = MAX_RETRIES;
    const mongoUri = envVars.DB_URL;

    while (retries > 0) {
        try {
            await mongoose.connect(mongoUri);
            console.log("Database connected successfully with Mongoose.");
            return;
        } catch (error) {
            retries -= 1;
            console.warn(`MongoDB connection failed. Retries left: ${retries}. Trying again in ${RETRY_DELAY_MS / 1000}s...`);
            console.error(error);

            if (retries === 0) {
                console.error("Max connection retries reached. Exiting application.");
                process.exit(1);
            }

            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
};