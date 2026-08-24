import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase } from '../setup.js';

describe('Health API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return a successful health response', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);

    const body = response.body as { database: string; status: string; timeStamp: string };
    expect(body.database).toBe('connected');
  });
});
