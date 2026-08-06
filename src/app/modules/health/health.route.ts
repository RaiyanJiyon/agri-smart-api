import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  // readystate 1 = connected
  const dbState = mongoose.connection.readyState;
  const isConnected = dbState === mongoose.ConnectionStates.connected;

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
    readyState: dbState,
  });
});

export const HealthRoutes = router;
