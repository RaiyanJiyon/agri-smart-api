/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../../../src/app.js';
import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { ProfileModel } from '../../../../src/app/modules/profile/profile.model.js';
import { CropRecommendationModel } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.model.js';
import { USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import { CROP_RECOMMENDATION_STATUS } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.constant.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';
import { createMockCropRecommendationInput } from '../../../fixtures/index.js';

vi.mock('../../../../src/app/jobs/crop-recommendation/crop-recommendation.queue.js', () => ({
  addCropRecommendationJob: vi.fn().mockResolvedValue({}),
}));

describe('Crop Recommendation API', () => {
  let accessToken: string;
  let userId: mongoose.Types.ObjectId;
  let profileId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    userId = new mongoose.Types.ObjectId();
    profileId = new mongoose.Types.ObjectId();

    const hashedPassword = await hashPassword('Password123!');

    await AuthModel.create({
      _id: userId,
      name: 'Test Farmer',
      email: 'cropfarmer@example.com',
      password: hashedPassword,
      role: 'farmer',
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
      passwordChangedAt: new Date(),
    });

    await ProfileModel.create({
      _id: profileId,
      userId,
      firstName: 'Test',
      lastName: 'Farmer',
      address: 'Rangpur, Bangladesh',
    });

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'cropfarmer@example.com',
      password: 'Password123!',
    });

    expect(loginResponse.status).toBe(200);

    accessToken = loginResponse.body.data.accessToken;

    expect(accessToken).toBeDefined();
  });

  // ============================================================
  // POST /api/v1/crop-recommendations
  // ============================================================

  describe('POST /api/v1/crop-recommendations', () => {
    it('should create a crop recommendation request successfully', async () => {
      const inputParameters = createMockCropRecommendationInput();

      const response = await request(app)
        .post('/api/v1/crop-recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profileId: profileId.toString(),
          inputParameters,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Crop recommendation generated successfully.');

      expect(response.body.data).toMatchObject({
        userId: userId.toString(),
        profileId: profileId.toString(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
      });

      expect(response.body.data._id).toBeDefined();

      const stored = await CropRecommendationModel.findById(response.body.data._id);

      expect(stored).not.toBeNull();
      expect(stored?.userId.toString()).toBe(userId.toString());
      expect(stored?.processingStatus).toBe(CROP_RECOMMENDATION_STATUS.PENDING);
    });

    it('should reject invalid input parameters with 400 Bad Request', async () => {
      const response = await request(app)
        .post('/api/v1/crop-recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profileId: profileId.toString(),
          inputParameters: {
            location: '',
            fieldArea: -5,
            soilType: '',
            soilPh: 18, // invalid pH > 14
            nitrogen: -10,
            phosphorus: -5,
            potassium: -5,
            averageTemperature: 25,
            annualRainfall: -100,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation Error');
      expect(response.body.errorSources).toBeDefined();
    });

    it('should reject when unauthenticated with 401 Unauthorized', async () => {
      const response = await request(app).post('/api/v1/crop-recommendations').send({
        profileId: profileId.toString(),
        inputParameters: createMockCropRecommendationInput(),
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject when using another user profile with 403 Forbidden', async () => {
      const anotherProfileId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/v1/crop-recommendations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profileId: anotherProfileId.toString(),
          inputParameters: createMockCropRecommendationInput(),
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to use this profile.');
    });
  });

  // ============================================================
  // GET /api/v1/crop-recommendations
  // ============================================================

  describe('GET /api/v1/crop-recommendations', () => {
    it('should return crop recommendations belonging to the user', async () => {
      await CropRecommendationModel.create([
        {
          userId,
          profileId,
          inputParameters: createMockCropRecommendationInput({ location: 'Field 1' }),
          processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
          requestedAt: new Date(),
        },
        {
          userId,
          profileId,
          inputParameters: createMockCropRecommendationInput({ location: 'Field 2' }),
          processingStatus: CROP_RECOMMENDATION_STATUS.COMPLETED,
          requestedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .get('/api/v1/crop-recommendations')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Crop recommendations retrieved successfully.');
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty list when user has no recommendations', async () => {
      const response = await request(app)
        .get('/api/v1/crop-recommendations')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  // ============================================================
  // GET /api/v1/crop-recommendations/:recommendationId
  // ============================================================

  describe('GET /api/v1/crop-recommendations/:recommendationId', () => {
    it('should return a specific recommendation by ID', async () => {
      const created = await CropRecommendationModel.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.COMPLETED,
        recommendationResult: {
          recommendedCrops: ['Rice'],
          explanation: 'Suitable for flooded loamy soil.',
          confidence: 0.9,
        },
        requestedAt: new Date(),
      });

      const response = await request(app)
        .get(`/api/v1/crop-recommendations/${created._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Crop recommendation retrieved successfully.');
      expect(response.body.data._id).toBe(created._id.toString());
      expect(response.body.data.recommendationResult.recommendedCrops).toEqual(['Rice']);
    });

    it('should return 404 when recommendation does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/crop-recommendations/${nonExistentId.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Crop recommendation not found.');
    });

    it('should return 404 when accessing another user recommendation', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();
      const created = await CropRecommendationModel.create({
        userId: anotherUserId,
        profileId: new mongoose.Types.ObjectId(),
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const response = await request(app)
        .get(`/api/v1/crop-recommendations/${created._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Crop recommendation not found.');
    });
  });

  // ============================================================
  // DELETE /api/v1/crop-recommendations/:recommendationId
  // ============================================================

  describe('DELETE /api/v1/crop-recommendations/:recommendationId', () => {
    it('should delete a recommendation successfully', async () => {
      const created = await CropRecommendationModel.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const response = await request(app)
        .delete(`/api/v1/crop-recommendations/${created._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Crop recommendation deleted successfully.');

      const stored = await CropRecommendationModel.findById(created._id);

      expect(stored).toBeNull();
    });

    it('should return 404 when deleting a non-existent recommendation', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/v1/crop-recommendations/${nonExistentId.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Crop recommendation not found.');
    });

    it('should return 404 when deleting another user recommendation', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();
      const created = await CropRecommendationModel.create({
        userId: anotherUserId,
        profileId: new mongoose.Types.ObjectId(),
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const response = await request(app)
        .delete(`/api/v1/crop-recommendations/${created._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      const stored = await CropRecommendationModel.findById(created._id);

      expect(stored).not.toBeNull();
    });
  });
});
