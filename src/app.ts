import express from 'express';
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from 'cookie-parser';
import { notFound } from './middleware/notFound.js';
import { globalErrorHandler } from './middleware/globalErrorHandler.js';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    credentials: true // Allow cookies/auth headers if needed
}));

app.use(helmet());

app.use(compression());

app.use(cookieParser());

const port = process.env.PORT ?? 5000;

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.use(notFound);

app.use(globalErrorHandler);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});