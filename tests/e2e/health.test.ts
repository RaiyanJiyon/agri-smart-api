import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import mongoose from 'mongoose';

describe('Health API', () => {
  beforeAll(async () => {
    if (process.env.DB_URL) {
      await mongoose.connect(process.env.DB_URL);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return a successful health response', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);

    const body = response.body as { database: string; status: string; timeStamp: string };
    expect(body.database).toBe('connected');
  });
});
