import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './app/shared/config/env.js';
import { router } from './app/routes/index.js';
import { notFound } from './app/shared/middleware/notFound.js';
import { globalErrorHandler } from './app/shared/middleware/globalErrorHandler.js';

const app = express();

app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use(
  cors({
    origin: config.CLIENT_URL.length > 0 ? config.CLIENT_URL : ['http://localhost:5173'], // Allow multiple origins from the .env file
    credentials: true, // Allow cookies/auth headers if needed
  })
);

app.use(helmet());

app.use(compression());

app.use(cookieParser());

app.use('/api/v1', router);

app.get('/', (_req: Request, res: Response) => {
  res.send('Agri Smart server is up and running!');
});

app.use(notFound);

app.use(globalErrorHandler);

export default app;
