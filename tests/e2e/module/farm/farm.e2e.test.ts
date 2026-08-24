/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../../../src/app.js';

import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { ProfileModel } from '../../../../src/app/modules/profile/profile.model.js';
import { USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';

import { FarmModel } from '../../../../src/app/modules/farm/farm.model.js';
import { FARM_AREA_UNITS } from '../../../../src/app/modules/farm/farm.constant.js';

import { hashPassword } from '../../../../src/app/shared/utils/argon.js';

import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

describe('Farm API', () => {
  let accessToken: string;
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    userId = new mongoose.Types.ObjectId();

    const hashedPassword = await hashPassword('Password123!');

    await AuthModel.create({
      _id: userId,
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: hashedPassword,
      role: 'farmer',
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
      passwordChangedAt: new Date(),
    });

    await ProfileModel.create({
      userId,
    });

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'farmer@example.com',
      password: 'Password123!',
    });

    expect(loginResponse.status).toBe(200);

    accessToken = loginResponse.body.data.accessToken;

    expect(accessToken).toBeDefined();
  });

  // ============================================================
  // POST /api/v1/farms
  // ============================================================

  describe('POST /api/v1/farms', () => {
    it('should create a farm successfully', async () => {
      const response = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Green Valley Farm',
          location: 'Rangpur, Bangladesh',
          area: 10,
          areaUnit: FARM_AREA_UNITS.ACRE,
        });

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Farm created successfully.');

      expect(response.body.data).toMatchObject({
        userId: userId.toString(),
        name: 'Green Valley Farm',
        location: 'Rangpur, Bangladesh',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      expect(response.body.data._id).toBeDefined();

      const farm = await FarmModel.findById(response.body.data._id);

      expect(farm).not.toBeNull();
      expect(farm?.userId.toString()).toBe(userId.toString());
    });

    it('should reject an invalid farm body', async () => {
      const response = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'A',
          location: '',
          area: -10,
          areaUnit: 'invalid-unit',
        });

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation Error');

      expect(response.body.errorSources).toBeDefined();
      expect(response.body.errorSources.length).toBeGreaterThan(0);
    });

    it('should reject an unauthenticated request', async () => {
      const response = await request(app).post('/api/v1/farms').send({
        name: 'Unauthorized Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      expect(response.status).toBe(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET /api/v1/farms
  // ============================================================

  describe('GET /api/v1/farms', () => {
    it('should return farms belonging to the authenticated user', async () => {
      await FarmModel.create([
        {
          userId,
          name: 'Farm One',
          location: 'Rangpur',
          area: 10,
          areaUnit: FARM_AREA_UNITS.ACRE,
        },
        {
          userId,
          name: 'Farm Two',
          location: 'Dinajpur',
          area: 20,
          areaUnit: FARM_AREA_UNITS.HECTARE,
        },
      ]);

      const response = await request(app)
        .get('/api/v1/farms')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Farms retrieved successfully.');

      expect(response.body.data).toHaveLength(2);

      expect(
        response.body.data.every((farm: { userId: string }) => farm.userId === userId.toString())
      ).toBe(true);
    });

    it('should return an empty array when the user has no farms', async () => {
      const response = await request(app)
        .get('/api/v1/farms')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  // ============================================================
  // GET /api/v1/farms/:farmId
  // ============================================================

  describe('GET /api/v1/farms/:farmId', () => {
    it('should return a farm belonging to the authenticated user', async () => {
      const farm = await FarmModel.create({
        userId,
        name: 'Green Valley Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      const response = await request(app)
        .get(`/api/v1/farms/${farm._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Farm retrieved successfully.');

      expect(response.body.data).toMatchObject({
        _id: farm._id.toString(),
        userId: userId.toString(),
        name: 'Green Valley Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });
    });

    it('should return 404 when the farm does not exist', async () => {
      const farmId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/farms/${farmId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Farm not found.');
    });

    it('should return 404 when accessing another user farm', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();

      const farm = await FarmModel.create({
        userId: anotherUserId,
        name: 'Private Farm',
        location: 'Dhaka',
        area: 50,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      const response = await request(app)
        .get(`/api/v1/farms/${farm._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Farm not found.');
    });

    it('should return 400 for an invalid farm id', async () => {
      const response = await request(app)
        .get('/api/v1/farms/invalid-farm-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // PATCH /api/v1/farms/:farmId
  // ============================================================

  describe('PATCH /api/v1/farms/:farmId', () => {
    it('should update a farm successfully', async () => {
      const farm = await FarmModel.create({
        userId,
        name: 'Old Farm Name',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      const response = await request(app)
        .patch(`/api/v1/farms/${farm._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Farm Name',
          area: 25,
        });

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Farm updated successfully.');

      expect(response.body.data).toMatchObject({
        _id: farm._id.toString(),
        userId: userId.toString(),
        name: 'Updated Farm Name',
        location: 'Rangpur',
        area: 25,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      const updatedFarm = await FarmModel.findById(farm._id);

      expect(updatedFarm).not.toBeNull();
      expect(updatedFarm?.name).toBe('Updated Farm Name');
      expect(updatedFarm?.area).toBe(25);
    });

    it('should update only the provided fields', async () => {
      const farm = await FarmModel.create({
        userId,
        name: 'Original Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      const response = await request(app)
        .patch(`/api/v1/farms/${farm._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          area: 30,
        });

      expect(response.status).toBe(200);

      expect(response.body.data).toMatchObject({
        name: 'Original Farm',
        location: 'Rangpur',
        area: 30,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });
    });

    it('should reject an empty update body', async () => {
      const farm = await FarmModel.create({
        userId,
        name: 'Existing Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      const response = await request(app)
        .patch(`/api/v1/farms/${farm._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation Error');
    });

    it('should return 404 when updating another user farm', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();

      const farm = await FarmModel.create({
        userId: anotherUserId,
        name: 'Protected Farm',
        location: 'Dhaka',
        area: 50,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      const response = await request(app)
        .patch(`/api/v1/farms/${farm._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Hacked Farm',
        });

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Farm not found.');

      const unchangedFarm = await FarmModel.findById(farm._id);

      expect(unchangedFarm).not.toBeNull();
      expect(unchangedFarm?.name).toBe('Protected Farm');
    });
  });

  // ============================================================
  // DELETE /api/v1/farms/:farmId
  // ============================================================

  describe('DELETE /api/v1/farms/:farmId', () => {
    it('should delete a farm successfully', async () => {
      const farm = await FarmModel.create({
        userId,
        name: 'Farm To Delete',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      const response = await request(app)
        .delete(`/api/v1/farms/${farm._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Farm deleted successfully.');
      expect(response.body.data).toBeNull();

      const deletedFarm = await FarmModel.findById(farm._id);

      expect(deletedFarm).toBeNull();
    });

    it('should return 404 when deleting a farm that does not exist', async () => {
      const farmId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/v1/farms/${farmId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Farm not found.');
    });

    it('should return 404 when deleting another user farm', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();

      const farm = await FarmModel.create({
        userId: anotherUserId,
        name: 'Protected Farm',
        location: 'Dhaka',
        area: 50,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      const response = await request(app)
        .delete(`/api/v1/farms/${farm._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Farm not found.');

      const existingFarm = await FarmModel.findById(farm._id);

      expect(existingFarm).not.toBeNull();
      expect(existingFarm?.name).toBe('Protected Farm');
    });
  });
});
