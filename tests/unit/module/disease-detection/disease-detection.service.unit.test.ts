/* eslint-disable @typescript-eslint/unbound-method */
import { Buffer } from 'node:buffer';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiseaseDetectionService } from '../../../../src/app/modules/disease-detection/disease-detection.service.js';
import { DiseaseDetectionRepository } from '../../../../src/app/modules/disease-detection/disease-detection.repository.js';
import { ProfileRepository } from '../../../../src/app/modules/profile/profile.repository.js';
import { CloudinaryService } from '../../../../src/app/shared/integrations/storage/cloudinary.service.js';
import { addDiseaseDetectionJob } from '../../../../src/app/jobs/disease-detection/disease-detection.queue.js';
import {
  createMockProfile,
  createMockDiseaseReport,
  createMockDiseaseReportList,
} from '../../../fixtures/index.js';

vi.mock(
  '../../../../src/app/modules/disease-detection/disease-detection.repository.js',
  () => ({
    DiseaseDetectionRepository: {
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

vi.mock('../../../../src/app/shared/integrations/storage/cloudinary.service.js', () => ({
  CloudinaryService: {
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
  },
}));

vi.mock('../../../../src/app/jobs/disease-detection/disease-detection.queue.js', () => ({
  addDiseaseDetectionJob: vi.fn(),
}));

describe('DiseaseDetectionService', () => {
  const mockFile = {
    buffer: Buffer.from('fake-image-bytes'),
    originalname: 'leaf.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
  } as Express.Multer.File;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDiseaseDetection', () => {
    it('should upload image, create disease report, and enqueue job when valid', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ _id: profileId, userId });

      const uploadedImage = {
        url: 'https://cloudinary.com/sample.jpg',
        publicId: 'disease-detection/sample',
      };

      const createdReport = createMockDiseaseReport({
        userId,
        profileId,
        image: uploadedImage,
      });

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);
      vi.mocked(CloudinaryService.uploadImage).mockResolvedValue(uploadedImage);
      vi.mocked(DiseaseDetectionRepository.create).mockResolvedValue(createdReport);
      vi.mocked(addDiseaseDetectionJob).mockResolvedValue(undefined as unknown as never);

      const result = await DiseaseDetectionService.createDiseaseDetection(
        userId,
        { profileId },
        mockFile
      );

      expect(result).toEqual(createdReport);

      expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);

      expect(CloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockFile.buffer,
        'disease-detection'
      );

      expect(DiseaseDetectionRepository.create).toHaveBeenCalledWith({
        userId,
        profileId,
        image: uploadedImage,
        processingStatus: 'pending',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        requestedAt: expect.any(Date),
      });

      expect(addDiseaseDetectionJob).toHaveBeenCalledWith({
        reportId: createdReport._id.toString(),
        userId: userId.toString(),
        profileId: profileId.toString(),
        imageUrl: uploadedImage.url,
        imagePublicId: uploadedImage.publicId,
      });
    });

    it('should throw NOT_FOUND when profile does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(null);

      await expect(
        DiseaseDetectionService.createDiseaseDetection(userId, { profileId }, mockFile)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found.',
      });

      expect(CloudinaryService.uploadImage).not.toHaveBeenCalled();
      expect(DiseaseDetectionRepository.create).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when provided profileId does not match user profile', async () => {
      const userId = new mongoose.Types.ObjectId();
      const userProfileId = new mongoose.Types.ObjectId();
      const otherProfileId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ _id: userProfileId, userId });

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);

      await expect(
        DiseaseDetectionService.createDiseaseDetection(userId, { profileId: otherProfileId }, mockFile)
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'You do not have permission to use this profile.',
      });

      expect(CloudinaryService.uploadImage).not.toHaveBeenCalled();
    });

    it('should throw BAD_REQUEST when file is missing', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ _id: profileId, userId });

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);

      await expect(
        DiseaseDetectionService.createDiseaseDetection(
          userId,
          { profileId },
          undefined as unknown as Express.Multer.File
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Disease image is required.',
      });

      expect(CloudinaryService.uploadImage).not.toHaveBeenCalled();
    });

    it('should delete uploaded image from Cloudinary if repository creation fails', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ _id: profileId, userId });

      const uploadedImage = {
        url: 'https://cloudinary.com/sample.jpg',
        publicId: 'disease-detection/sample',
      };

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);
      vi.mocked(CloudinaryService.uploadImage).mockResolvedValue(uploadedImage);
      vi.mocked(DiseaseDetectionRepository.create).mockRejectedValue(
        new Error('Database Failure')
      );

      await expect(
        DiseaseDetectionService.createDiseaseDetection(userId, { profileId }, mockFile)
      ).rejects.toThrow('Database Failure');

      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith('disease-detection/sample');
    });

    it('should silently swallow Cloudinary delete failure during creation error cleanup', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ _id: profileId, userId });

      const uploadedImage = {
        url: 'https://cloudinary.com/sample.jpg',
        publicId: 'disease-detection/sample',
      };

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);
      vi.mocked(CloudinaryService.uploadImage).mockResolvedValue(uploadedImage);
      vi.mocked(DiseaseDetectionRepository.create).mockRejectedValue(
        new Error('Database Failure')
      );
      vi.mocked(CloudinaryService.deleteImage).mockRejectedValue(
        new Error('Cloudinary Delete Error')
      );

      await expect(
        DiseaseDetectionService.createDiseaseDetection(userId, { profileId }, mockFile)
      ).rejects.toThrow('Database Failure');
    });
  });

  describe('getMyReports', () => {
    it('should return all reports belonging to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const reports = createMockDiseaseReportList(2, { userId });

      vi.mocked(DiseaseDetectionRepository.findByUserId).mockResolvedValue(reports);

      const result = await DiseaseDetectionService.getMyReports(userId);

      expect(result).toEqual(reports);
      expect(DiseaseDetectionRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getMyReport', () => {
    it('should return the report when found for the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const reportId = new mongoose.Types.ObjectId();
      const report = createMockDiseaseReport({ _id: reportId, userId });

      vi.mocked(DiseaseDetectionRepository.findByIdAndUserId).mockResolvedValue(report);

      const result = await DiseaseDetectionService.getMyReport(reportId, userId);

      expect(result).toEqual(report);
      expect(DiseaseDetectionRepository.findByIdAndUserId).toHaveBeenCalledWith(reportId, userId);
    });

    it('should throw NOT_FOUND when report does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();
      const reportId = new mongoose.Types.ObjectId();

      vi.mocked(DiseaseDetectionRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(
        DiseaseDetectionService.getMyReport(reportId, userId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Disease report not found.',
      });
    });
  });

  describe('deleteMyReport', () => {
    it('should delete image from Cloudinary and report from repository when found', async () => {
      const userId = new mongoose.Types.ObjectId();
      const reportId = new mongoose.Types.ObjectId();
      const report = createMockDiseaseReport({
        _id: reportId,
        userId,
        image: {
          url: 'https://cloudinary.com/sample.jpg',
          publicId: 'disease-detection/sample',
        },
      });

      vi.mocked(DiseaseDetectionRepository.findByIdAndUserId).mockResolvedValue(report);
      vi.mocked(CloudinaryService.deleteImage).mockResolvedValue({} as never);
      vi.mocked(DiseaseDetectionRepository.deleteByIdAndUserId).mockResolvedValue(report);

      await DiseaseDetectionService.deleteMyReport(reportId, userId);

      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith('disease-detection/sample');
      expect(DiseaseDetectionRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
        reportId,
        userId
      );
    });

    it('should throw NOT_FOUND when trying to delete non-existent report', async () => {
      const userId = new mongoose.Types.ObjectId();
      const reportId = new mongoose.Types.ObjectId();

      vi.mocked(DiseaseDetectionRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(
        DiseaseDetectionService.deleteMyReport(reportId, userId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Disease report not found.',
      });

      expect(CloudinaryService.deleteImage).not.toHaveBeenCalled();
      expect(DiseaseDetectionRepository.deleteByIdAndUserId).not.toHaveBeenCalled();
    });
  });
});
