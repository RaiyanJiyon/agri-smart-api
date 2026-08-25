import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DiseaseDetectionRepository } from '../../../../src/app/modules/disease-detection/disease-detection.repository.js';
import { DiseaseReportModel } from '../../../../src/app/modules/disease-detection/disease-detection.model.js';
import { DISEASE_DETECTION_STATUS } from '../../../../src/app/modules/disease-detection/disease-detection.constant.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';
import type { DiseaseReport } from '../../../../src/app/modules/disease-detection/disease-detection.interface.js';

describe('DiseaseDetectionRepository integration', () => {
  let userId: mongoose.Types.ObjectId;
  let anotherUserId: mongoose.Types.ObjectId;
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
    anotherUserId = new mongoose.Types.ObjectId();
    profileId = new mongoose.Types.ObjectId();
  });

  describe('create', () => {
    it('should create a disease report document in MongoDB', async () => {
      const payload = {
        userId,
        profileId,
        image: {
          url: 'https://cloudinary.com/sample.jpg',
          publicId: 'disease-detection/sample',
        },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      };

      const result = (await DiseaseDetectionRepository.create(payload)) as DiseaseReport & {
        _id: mongoose.Types.ObjectId;
      };

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.userId.toString()).toBe(userId.toString());
      expect(result.profileId.toString()).toBe(profileId.toString());
      expect(result.processingStatus).toBe(DISEASE_DETECTION_STATUS.PENDING);
      expect(result.image.publicId).toBe('disease-detection/sample');

      const stored = await DiseaseReportModel.findById(result._id);

      expect(stored).not.toBeNull();
      expect(stored?.userId.toString()).toBe(userId.toString());
    });
  });

  describe('findByUserId', () => {
    it('should return user reports sorted by createdAt descending', async () => {
      const firstReport = await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/first.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.COMPLETED,
        requestedAt: new Date(Date.now() - 10_000),
      });

      const secondReport = await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/second.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const result = (await DiseaseDetectionRepository.findByUserId(userId)) as (DiseaseReport & {
        _id: mongoose.Types.ObjectId;
      })[];

      expect(result).toHaveLength(2);
      expect(result[0]?._id.toString()).toBe(secondReport._id.toString());
      expect(result[1]?._id.toString()).toBe(firstReport._id.toString());
    });

    it('should isolate reports belonging to other users', async () => {
      await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/user.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      await DiseaseReportModel.create({
        userId: anotherUserId,
        profileId: new mongoose.Types.ObjectId(),
        image: { url: 'https://cloudinary.com/another.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const result = await DiseaseDetectionRepository.findByUserId(userId);

      expect(result).toHaveLength(1);
      expect(result[0]?.userId.toString()).toBe(userId.toString());
    });
  });

  describe('findByIdAndUserId', () => {
    it('should return disease report when reportId and userId match', async () => {
      const created = await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/sample.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const result = await DiseaseDetectionRepository.findByIdAndUserId(created._id, userId);

      expect(result).not.toBeNull();
      expect(result?.userId.toString()).toBe(userId.toString());
    });

    it('should return null when report belongs to another user', async () => {
      const created = await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/sample.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const result = await DiseaseDetectionRepository.findByIdAndUserId(created._id, anotherUserId);

      expect(result).toBeNull();
    });
  });

  describe('updateById', () => {
    it('should update processing status and diagnosis result', async () => {
      const created = await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/sample.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const updated = await DiseaseDetectionRepository.updateById(created._id, {
        processingStatus: DISEASE_DETECTION_STATUS.COMPLETED,
        diagnosisResult: {
          disease: 'Leaf Spot',
          explanation: 'Fungal leaf spot detected.',
          recommendedActions: ['Spray fungicide'],
          confidence: 0.91,
        },
        completedAt: new Date(),
      });

      expect(updated).not.toBeNull();
      expect(updated?.processingStatus).toBe(DISEASE_DETECTION_STATUS.COMPLETED);
      expect(updated?.diagnosisResult?.disease).toBe('Leaf Spot');
    });
  });

  describe('deleteByIdAndUserId', () => {
    it('should delete report when reportId and userId match', async () => {
      const created = await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/sample.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const deleted = await DiseaseDetectionRepository.deleteByIdAndUserId(created._id, userId);

      expect(deleted).not.toBeNull();

      const stored = await DiseaseReportModel.findById(created._id);

      expect(stored).toBeNull();
    });

    it('should return null and not delete report belonging to another user', async () => {
      const created = await DiseaseReportModel.create({
        userId,
        profileId,
        image: { url: 'https://cloudinary.com/sample.jpg' },
        processingStatus: DISEASE_DETECTION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const deleted = await DiseaseDetectionRepository.deleteByIdAndUserId(
        created._id,
        anotherUserId
      );

      expect(deleted).toBeNull();

      const stored = await DiseaseReportModel.findById(created._id);

      expect(stored).not.toBeNull();
    });
  });
});
