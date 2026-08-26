/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../../../src/app.js';
import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { ProfileModel } from '../../../../src/app/modules/profile/profile.model.js';
import { FarmModel } from '../../../../src/app/modules/farm/farm.model.js';
import { CropRecommendationModel } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.model.js';
import { DiseaseReportModel } from '../../../../src/app/modules/disease-detection/disease-detection.model.js';
import { ConversationModel } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.model.js';
import { USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import { FARM_AREA_UNITS } from '../../../../src/app/modules/farm/farm.constant.js';
import { CROP_RECOMMENDATION_STATUS } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.constant.js';
import { DISEASE_DETECTION_STATUS } from '../../../../src/app/modules/disease-detection/disease-detection.constant.js';
import { CONVERSATION_STATUS } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.constant.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

describe('Dashboard API', () => {
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
      name: 'Dashboard Farmer',
      email: 'dashfarmer@example.com',
      password: hashedPassword,
      role: 'farmer',
      isEmailVerified: true,
      status: USER_STATUS.ACTIVE,
      passwordChangedAt: new Date(),
    });

    await ProfileModel.create({
      _id: profileId,
      userId,
      firstName: 'Dashboard',
      lastName: 'Farmer',
      address: 'Bogura, Bangladesh',
    });

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'dashfarmer@example.com',
      password: 'Password123!',
    });

    expect(loginResponse.status).toBe(200);
    accessToken = loginResponse.body.data.accessToken;
    expect(accessToken).toBeDefined();
  });

  describe('GET /api/v1/dashboard', () => {
    it('should return aggregated dashboard data for authenticated user', async () => {
      await FarmModel.create({
        userId,
        name: 'My Green Farm',
        location: 'Bogura',
        area: 5,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      await CropRecommendationModel.create({
        userId,
        profileId,
        inputParameters: {
          nitrogen: 50,
          phosphorus: 30,
          potassium: 20,
          ph: 6.5,
          rainfall: 200,
          temperature: 28,
        },
        status: CROP_RECOMMENDATION_STATUS.COMPLETED,
        recommendations: [{ crop: 'Rice', suitabilityScore: 0.95, reasoning: 'Optimal' }],
      });

      await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/test.jpg', publicId: 'test' },
        processingStatus: DISEASE_DETECTION_STATUS.COMPLETED,
        diagnosisResult: {
          disease: 'Healthy',
          explanation: 'No disease detected',
          recommendedActions: ['Continue care'],
          confidence: 0.99,
        },
      });

      await ConversationModel.create({
        userId,
        profileId,
        title: 'Crop Inquiry',
        status: CONVERSATION_STATUS.ACTIVE,
      });

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Dashboard retrieved successfully.');
      expect(response.body.data.profile).toBeDefined();
      expect(response.body.data.profile.firstName).toBe('Dashboard');
      expect(response.body.data.farms).toHaveLength(1);
      expect(response.body.data.recentRecommendations).toHaveLength(1);
      expect(response.body.data.recentDiseaseReports).toHaveLength(1);
      expect(response.body.data.recentConversations).toHaveLength(1);
    });

    it('should return 401 Unauthorized when request is unauthenticated', async () => {
      const response = await request(app).get('/api/v1/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
