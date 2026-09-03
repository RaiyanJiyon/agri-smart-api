import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../../shared/constants/index.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  // readystate 1 = connected
  // const dbState = mongoose.connection.readyState;
  const isConnected = mongoose.connection.readyState === mongoose.ConnectionStates.connected;

  if (isConnected) {
    return res.status(HTTP_STATUS.OK).json({
      status: 'UP',
      timeStamp: new Date().toISOString(),
      database: 'connected',
    });
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: 'DOWN',
    timeStamp: new Date().toISOString(),
    database: 'disconnected',
    // ! Removed 'readyState: dbState' to prevent leaking internal infrastructure details
    // readyState: dbState,
  });
});

export const HealthRoutes = router;
