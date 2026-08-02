import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { notFound } from './middleware/notFound.js';
import { globalErrorHandler } from './middleware/globalErrorHandler.js';
import { config } from './config/env.js';
import { router } from './routes/index.js';

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: config.CLIENT_URL ?? 'http://localhost:3000',
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
