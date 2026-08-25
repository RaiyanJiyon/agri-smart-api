import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { CropRecommendationRepository } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.repository.js';
import { CropRecommendationModel } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.model.js';
import { CROP_RECOMMENDATION_STATUS } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.constant.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';
import { CropRecommendation } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.interface.js';
import { createMockCropRecommendationInput } from '../../../fixtures/index.js';

describe('CropRecommendationRepository integration', () => {
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
    it('should create a crop recommendation document in MongoDB', async () => {
      const inputParameters = createMockCropRecommendationInput();

      const payload = {
        userId,
        profileId,
        inputParameters,
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      };

      const result = (await CropRecommendationRepository.create(payload)) as CropRecommendation & {
        _id: mongoose.Types.ObjectId;
      };

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.userId.toString()).toBe(userId.toString());
      expect(result.profileId.toString()).toBe(profileId.toString());
      expect(result.processingStatus).toBe(CROP_RECOMMENDATION_STATUS.PENDING);
      expect(result.inputParameters.location).toBe('Rangpur, Bangladesh');

      const stored = await CropRecommendationModel.findById(result._id);

      expect(stored).not.toBeNull();
      expect(stored?.userId.toString()).toBe(userId.toString());
    });
  });

  describe('findByUserId', () => {
    it('should return all crop recommendations belonging to the user sorted by requestedAt newest first', async () => {
      const firstReport = (await CropRecommendationRepository.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput({ location: 'First Field' }),
        processingStatus: CROP_RECOMMENDATION_STATUS.COMPLETED,
        requestedAt: new Date(Date.now() - 10_000),
      })) as CropRecommendation & { _id: mongoose.Types.ObjectId };

      const secondReport = (await CropRecommendationRepository.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput({ location: 'Second Field' }),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      })) as CropRecommendation & { _id: mongoose.Types.ObjectId };

      const result = (await CropRecommendationRepository.findByUserId(
        userId
      )) as (CropRecommendation & {
        _id: mongoose.Types.ObjectId;
      })[];

      expect(result).toHaveLength(2);

      expect(result[0]?._id.toString()).toBe(secondReport._id.toString());
      expect(result[1]?._id.toString()).toBe(firstReport._id.toString());
    });

    it('should not return recommendations belonging to another user', async () => {
      await CropRecommendationRepository.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      await CropRecommendationRepository.create({
        userId: anotherUserId,
        profileId: new mongoose.Types.ObjectId(),
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      });

      const result = await CropRecommendationRepository.findByUserId(userId);

      expect(result).toHaveLength(1);
      expect(result[0]?.userId.toString()).toBe(userId.toString());
    });
  });

  describe('findByIdAndUserId', () => {
    it('should return the recommendation when ID and userId match', async () => {
      const created = (await CropRecommendationRepository.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      })) as CropRecommendation & { _id: mongoose.Types.ObjectId };

      const result = await CropRecommendationRepository.findByIdAndUserId(created._id, userId);

      expect(result).not.toBeNull();
      expect(result?.userId.toString()).toBe(userId.toString());
    });

    it('should return null when the recommendation belongs to another user', async () => {
      const created = (await CropRecommendationRepository.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      })) as CropRecommendation & { _id: mongoose.Types.ObjectId };

      const result = await CropRecommendationRepository.findByIdAndUserId(
        created._id,
        anotherUserId
      );

      expect(result).toBeNull();
    });
  });

  describe('updateById', () => {
    it('should update processingStatus and recommendationResult of a document', async () => {
      const created = (await CropRecommendationRepository.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      })) as CropRecommendation & { _id: mongoose.Types.ObjectId };

      const updated = await CropRecommendationRepository.updateById(created._id, {
        processingStatus: CROP_RECOMMENDATION_STATUS.COMPLETED,
        recommendationResult: {
          recommendedCrops: ['Wheat', 'Barley'],
          explanation: 'Soil is well suited for winter crops.',
          confidence: 0.95,
        },
        completedAt: new Date(),
      });

      expect(updated).not.toBeNull();
      expect(updated?.processingStatus).toBe(CROP_RECOMMENDATION_STATUS.COMPLETED);
      expect(updated?.recommendationResult?.recommendedCrops).toEqual(['Wheat', 'Barley']);
      expect(updated?.completedAt).toBeDefined();
    });
  });

  describe('deleteByIdAndUserId', () => {
    it('should delete recommendation document when ID and userId match', async () => {
      const created = (await CropRecommendationRepository.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      })) as CropRecommendation & { _id: mongoose.Types.ObjectId };

      const deleted = await CropRecommendationRepository.deleteByIdAndUserId(created._id, userId);

      expect(deleted).not.toBeNull();

      const stored = await CropRecommendationModel.findById(created._id);

      expect(stored).toBeNull();
    });

    it('should not delete recommendation belonging to another user', async () => {
      const created = (await CropRecommendationRepository.create({
        userId,
        profileId,
        inputParameters: createMockCropRecommendationInput(),
        processingStatus: CROP_RECOMMENDATION_STATUS.PENDING,
        requestedAt: new Date(),
      })) as CropRecommendation & { _id: mongoose.Types.ObjectId };

      const deleted = await CropRecommendationRepository.deleteByIdAndUserId(
        created._id,
        anotherUserId
      );

      expect(deleted).toBeNull();

      const stored = await CropRecommendationModel.findById(created._id);

      expect(stored).not.toBeNull();
    });
  });
});
