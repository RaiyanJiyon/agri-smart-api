/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../../../src/app.js';
import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { ProfileModel } from '../../../../src/app/modules/profile/profile.model.js';
import { DiseaseReportModel } from '../../../../src/app/modules/disease-detection/disease-detection.model.js';
import { USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import { DISEASE_DETECTION_STATUS } from '../../../../src/app/modules/disease-detection/disease-detection.constant.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

vi.mock('../../../../src/app/shared/integrations/storage/cloudinary.service.js', () => ({
  CloudinaryService: {
    uploadImage: vi.fn().mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v123456789/disease-detection/sample.jpg',
      publicId: 'disease-detection/sample',
    }),
    deleteImage: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../../src/app/jobs/disease-detection/disease-detection.queue.js', () => ({
  addDiseaseDetectionJob: vi.fn().mockResolvedValue({}),
}));

describe('Disease Detection API', () => {
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
      email: 'diseasefarmer@example.com',
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
      email: 'diseasefarmer@example.com',
      password: 'Password123!',
    });

    expect(loginResponse.status).toBe(200);
    accessToken = loginResponse.body.data.accessToken;
    expect(accessToken).toBeDefined();
  });

  // ============================================================
  // POST /api/v1/disease-detection
  // ============================================================

  describe('POST /api/v1/disease-detection', () => {
    it('should upload leaf image and create disease detection report successfully', async () => {
      const response = await request(app)
        .post('/api/v1/disease-detection')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('profileId', profileId.toString())
        .attach('image', Buffer.from('fake-image-data'), 'plant_leaf.jpg');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Disease detection completed successfully.');

      expect(response.body.data).toMatchObject({
        userId: userId.toString(),
        profileId: profileId.toString(),
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        image: {
          url: 'https://res.cloudinary.com/demo/image/upload/v123456789/disease-detection/sample.jpg',
          publicId: 'disease-detection/sample',
        },
      });

      expect(response.body.data._id).toBeDefined();

      const stored = await DiseaseReportModel.findById(response.body.data._id);
      expect(stored).not.toBeNull();
      expect(stored?.userId.toString()).toBe(userId.toString());
    });

    it('should return 400 Bad Request when profileId is missing', async () => {
      const response = await request(app)
        .post('/api/v1/disease-detection')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('image', Buffer.from('fake-image-data'), 'plant_leaf.jpg');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when image attachment is missing', async () => {
      const response = await request(app)
        .post('/api/v1/disease-detection')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('profileId', profileId.toString());

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Disease image is required.');
    });

    it('should return 401 Unauthorized when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/v1/disease-detection')
        .field('profileId', profileId.toString())
        .attach('image', Buffer.from('fake-image-data'), 'plant_leaf.jpg');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 Forbidden when using another user profileId', async () => {
      const anotherProfileId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/v1/disease-detection')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('profileId', anotherProfileId.toString())
        .attach('image', Buffer.from('fake-image-data'), 'plant_leaf.jpg');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('You do not have permission to use this profile.');
    });
  });

  // ============================================================
  // GET /api/v1/disease-detection
  // ============================================================

  describe('GET /api/v1/disease-detection', () => {
    it('should return user disease reports', async () => {
      await DiseaseReportModel.create([
        {
          userId,
          profileId,
          image: { url: 'https://cloudinary.com/report1.jpg' },
          processingStatus: DISEASE_DETECTION_STATUS.PENDING,
          requestedAt: new Date(),
        },
        {
          userId,
          profileId,
          image: { url: 'https://cloudinary.com/report2.jpg' },
          processingStatus: DISEASE_DETECTION_STATUS.COMPLETED,
          requestedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .get('/api/v1/disease-detection')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Disease reports retrieved successfully.');
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty list when user has no disease reports', async () => {
      const response = await request(app)
        .get('/api/v1/disease-detection')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  // ============================================================
  // GET /api/v1/disease-detection/:reportId
  // ============================================================

  describe('GET /api/v1/disease-detection/:reportId', () => {
    it('should return a specific report by ID', async () => {
      const created = await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/report.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.COMPLETED,
        diagnosisResult: {
          disease: 'Tomato Blight',
          explanation: 'Fungal infection detected.',
          recommendedActions: ['Spray copper fungicide'],
          confidence: 0.95,
        },
        requestedAt: new Date(),
      });

      const response = await request(app)
        .get(`/api/v1/disease-detection/${created._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Disease report retrieved successfully.');
      expect(response.body.data._id).toBe(created._id.toString());
      expect(response.body.data.diagnosisResult.disease).toBe('Tomato Blight');
    });

    it('should return 404 when report does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/v1/disease-detection/${nonExistentId.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Disease report not found.');
    });

    it('should return 404 when accessing another user report', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();
      const created = await DiseaseReportModel.create({
        userId: anotherUserId,
        profileId: new mongoose.Types.ObjectId(),
        image: { url: 'https://cloudinary.com/another.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const response = await request(app)
        .get(`/api/v1/disease-detection/${created._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================
  // DELETE /api/v1/disease-detection/:reportId
  // ============================================================

  describe('DELETE /api/v1/disease-detection/:reportId', () => {
    it('should delete a disease report successfully', async () => {
      const created = await DiseaseReportModel.create({
        userId,
        profileId,
        image: {
          url: 'https://cloudinary.com/report.jpg',
          publicId: 'disease-detection/sample',
        },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const response = await request(app)
        .delete(`/api/v1/disease-detection/${created._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Disease report deleted successfully.');

      const stored = await DiseaseReportModel.findById(created._id);
      expect(stored).toBeNull();
    });

    it('should return 404 when deleting a non-existent report', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/v1/disease-detection/${nonExistentId.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Disease report not found.');
    });

    it('should return 404 when deleting another user report', async () => {
      const anotherUserId = new mongoose.Types.ObjectId();
      const created = await DiseaseReportModel.create({
        userId: anotherUserId,
        profileId: new mongoose.Types.ObjectId(),
        image: { url: 'https://cloudinary.com/report.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const response = await request(app)
        .delete(`/api/v1/disease-detection/${created._id.toString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);

      const stored = await DiseaseReportModel.findById(created._id);
      expect(stored).not.toBeNull();
    });
  });
});
