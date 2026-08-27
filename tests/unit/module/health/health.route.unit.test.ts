import express, { type Express } from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthRoutes } from '../../../../src/app/modules/health/health.route.js';

describe('HealthRoutes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use('/health', HealthRoutes);
  });

  it('should return HTTP 200 UP when mongoose connection state is connected', async () => {
    const readyStateGetter = vi.spyOn(mongoose.connection, 'readyState', 'get');
    readyStateGetter.mockReturnValue(mongoose.ConnectionStates.connected);

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'UP',
      database: 'connected',
    });

    readyStateGetter.mockRestore();
  });

  it('should return HTTP 500 DOWN when mongoose connection state is disconnected', async () => {
    const readyStateGetter = vi.spyOn(mongoose.connection, 'readyState', 'get');
    readyStateGetter.mockReturnValue(mongoose.ConnectionStates.disconnected);

    const response = await request(app).get('/health');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      status: 'DOWN',
      database: 'disconnected',
    });

    readyStateGetter.mockRestore();
  });
});
