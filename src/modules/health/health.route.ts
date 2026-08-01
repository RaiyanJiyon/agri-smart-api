import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { StatusCodes } from '../../constants/statusCodes.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  // readystate 1 = connected
  const dbState = mongoose.connection.readyState;
  const isConnected = dbState === mongoose.ConnectionStates.connected;

  if (isConnected) {
    return res.status(StatusCodes.OK).json({
      status: 'UP',
      timeStamp: new Date().toISOString(),
      database: 'connected',
    });
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'DOWN',
    timeStamp: new Date().toISOString(),
    database: 'disconnected',
    readyState: dbState,
  });
});

export default router;
