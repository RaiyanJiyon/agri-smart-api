import { envVars } from "./config/env.js";
import mongoose from "mongoose";
import app from "./app.js";

const startServer = async () => {
        if (!envVars.DB_URL) {
            console.error("");
            return;
        }

        await mongoose.connect(envVars.DB_URL);
        console.log("Connected to MongoDB");

        app.listen(envVars.PORT, () => {
            console.log(`Server is running on ${envVars.PORT}`);
        });
};

startServer().catch((error: unknown ) => {
    console.error("Failed to start server: ", error);
    process.exit(1);
});