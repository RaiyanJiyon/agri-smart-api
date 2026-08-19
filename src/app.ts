import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './app/shared/config/env.js';
import { router } from './app/routes/index.js';
import { notFound } from './app/shared/middleware/notFound.js';
import { globalErrorHandler } from './app/shared/middleware/globalErrorHandler.js';
import { globalRateLimiter } from './app/shared/middleware/rateLimiter.js';

const app = express();

/**
 * Tell Express it is running behind a trusted proxy (e.g., Nginx, ALB, Cloudflare)

 * This ensures req.ip correctly reflects the client's actual browser IP address.

 */
app.set('trust proxy', 1);

app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use(helmet());

app.use(
  cors({
    origin: config.CLIENT_URL.length > 0 ? config.CLIENT_URL : ['http://localhost:5173'], // Allow multiple origins from the .env file
    credentials: true, // Allow cookies/auth headers if needed
  })
);

// Configure secure compression with a custom filter to avoid BREACH risks
app.use(
  compression({
    filter: (req: Request, res: Response) => {
      // Avoid compress responses if a header indicates sensitive data or explicit opt-out
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Avoid compressing responses that set cookies to help mitigate BREACH attacks
      if (res.getHeader('Set-Cookie')) {
        return false;
      }
      // Fallback to standard compression filter for non-sensitive assets
      return compression.filter(req, res);
    },
  })
);

app.use(cookieParser());

// Mount Tier 4 Global Rate Limiter baseline across all /api/v1 routes
app.use('/api/v1', globalRateLimiter, router);

app.get('/', (_req: Request, res: Response) => {
  res.send('Agri Smart server is up and running!');
});

app.use(notFound);

app.use(globalErrorHandler);

export default app;
