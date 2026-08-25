import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CropRecommendationService } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.service.js';
import { CropRecommendationRepository } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.repository.js';
import { ProfileRepository } from '../../../../src/app/modules/profile/profile.repository.js';
import { addCropRecommendationJob } from '../../../../src/app/jobs/crop-recommendation/crop-recommendation.queue.js';
import {
  createMockProfile,
  createMockCropRecommendation,
  createMockCropRecommendationInput,
  createMockCropRecommendationList,
} from '../../../fixtures/index.js';

vi.mock(
  '../../../../src/app/modules/crop-recommendations/crop-recommendation.repository.js',
  () => ({
    CropRecommendationRepository: {
      create: vi.fn(),
      findByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      deleteByIdAndUserId: vi.fn(),
      updateById: vi.fn(),
    },
  })
);

vi.mock('../../../../src/app/modules/profile/profile.repository.js', () => ({
  ProfileRepository: {
    findByUserId: vi.fn(),
  },
}));

vi.mock('../../../../src/app/jobs/crop-recommendation/crop-recommendation.queue.js', () => ({
  addCropRecommendationJob: vi.fn(),
}));

describe('CropRecommendationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCropRecommendation', () => {
    it('should create a crop recommendation and enqueue a processing job when valid', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ _id: profileId, userId });

      const inputParameters = createMockCropRecommendationInput();
      const payload = {
        profileId,
        inputParameters,
      };

      const createdRecommendation = createMockCropRecommendation({
        userId,
        profileId,
        inputParameters,
      });

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);
      vi.mocked(CropRecommendationRepository.create).mockResolvedValue(createdRecommendation);
      vi.mocked(addCropRecommendationJob).mockResolvedValue(undefined as unknown as never);

      const result = await CropRecommendationService.createCropRecommendation(userId, payload);

      expect(result).toEqual(createdRecommendation);

      expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);

      expect(CropRecommendationRepository.create).toHaveBeenCalledWith({
        userId,
        profileId,
        inputParameters,
        processingStatus: 'pending',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        requestedAt: expect.any(Date),
      });

      expect(addCropRecommendationJob).toHaveBeenCalledWith({
        recommendationId: createdRecommendation._id.toString(),
        userId: userId.toString(),
        profileId: profileId.toString(),
        inputParameters,
      });
    });

    it('should throw NOT_FOUND when the user profile does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();

      const payload = {
        profileId,
        inputParameters: createMockCropRecommendationInput(),
      };

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(null);

      await expect(
        CropRecommendationService.createCropRecommendation(userId, payload)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found.',
      });

      expect(CropRecommendationRepository.create).not.toHaveBeenCalled();
      expect(addCropRecommendationJob).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when the provided profileId does not match the user profile', async () => {
      const userId = new mongoose.Types.ObjectId();
      const userProfileId = new mongoose.Types.ObjectId();
      const randomProfileId = new mongoose.Types.ObjectId();

      const userProfile = createMockProfile({ _id: userProfileId, userId });

      const payload = {
        profileId: randomProfileId,
        inputParameters: createMockCropRecommendationInput(),
      };

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(userProfile);

      await expect(
        CropRecommendationService.createCropRecommendation(userId, payload)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'You do not have permission to use this profile.',
      });

      expect(CropRecommendationRepository.create).not.toHaveBeenCalled();
      expect(addCropRecommendationJob).not.toHaveBeenCalled();
    });

    it('should throw INTERNAL_SERVER_ERROR when repository or job queue creation fails', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ _id: profileId, userId });

      const payload = {
        profileId,
        inputParameters: createMockCropRecommendationInput(),
      };

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);
      vi.mocked(CropRecommendationRepository.create).mockRejectedValue(
        new Error('Database Connection Error')
      );

      await expect(
        CropRecommendationService.createCropRecommendation(userId, payload)
      ).rejects.toMatchObject({
        statusCode: 500,
        message: 'Failed to create crop recommendation.',
      });
    });
  });

  describe('getMyRecommendations', () => {
    it('should return all crop recommendations belonging to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const recommendations = createMockCropRecommendationList(2, { userId });

      vi.mocked(CropRecommendationRepository.findByUserId).mockResolvedValue(recommendations);

      const result = await CropRecommendationService.getMyRecommendations(userId);

      expect(result).toEqual(recommendations);
      expect(CropRecommendationRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return an empty array when the user has no recommendations', async () => {
      const userId = new mongoose.Types.ObjectId();

      vi.mocked(CropRecommendationRepository.findByUserId).mockResolvedValue([]);

      const result = await CropRecommendationService.getMyRecommendations(userId);

      expect(result).toEqual([]);
      expect(CropRecommendationRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getMyRecommendation', () => {
    it('should return the recommendation when it exists and belongs to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const recommendationId = new mongoose.Types.ObjectId();
      const recommendation = createMockCropRecommendation({ _id: recommendationId, userId });

      vi.mocked(CropRecommendationRepository.findByIdAndUserId).mockResolvedValue(recommendation);

      const result = await CropRecommendationService.getMyRecommendation(recommendationId, userId);

      expect(result).toEqual(recommendation);
      expect(CropRecommendationRepository.findByIdAndUserId).toHaveBeenCalledWith(
        recommendationId,
        userId
      );
    });

    it('should throw NOT_FOUND when the recommendation does not exist or belongs to another user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const recommendationId = new mongoose.Types.ObjectId();

      vi.mocked(CropRecommendationRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(
        CropRecommendationService.getMyRecommendation(recommendationId, userId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Crop recommendation not found.',
      });

      expect(CropRecommendationRepository.findByIdAndUserId).toHaveBeenCalledWith(
        recommendationId,
        userId
      );
    });
  });

  describe('deleteMyRecommendation', () => {
    it('should delete the recommendation when it exists and belongs to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const recommendationId = new mongoose.Types.ObjectId();
      const recommendation = createMockCropRecommendation({ _id: recommendationId, userId });

      vi.mocked(CropRecommendationRepository.deleteByIdAndUserId).mockResolvedValue(
        recommendation as never
      );

      await expect(
        CropRecommendationService.deleteMyRecommendation(recommendationId, userId)
      ).resolves.toBeUndefined();

      expect(CropRecommendationRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
        recommendationId,
        userId
      );
    });

    it('should throw NOT_FOUND when trying to delete a non-existent or unowned recommendation', async () => {
      const userId = new mongoose.Types.ObjectId();
      const recommendationId = new mongoose.Types.ObjectId();

      vi.mocked(CropRecommendationRepository.deleteByIdAndUserId).mockResolvedValue(null);

      await expect(
        CropRecommendationService.deleteMyRecommendation(recommendationId, userId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Crop recommendation not found.',
      });

      expect(CropRecommendationRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
        recommendationId,
        userId
      );
    });
  });
});
