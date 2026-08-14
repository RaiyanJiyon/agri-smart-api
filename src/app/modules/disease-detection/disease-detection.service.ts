import type { Types } from 'mongoose';
import type {
  CreateDiseaseDetectionPayload,
  DiseaseReport,
} from './disease-detection.interface.js';
import { DiseaseDetectionRepository } from './disease-detection.repository.js';
import { ProfileRepository } from '../profile/profile.repository.js';
import { ApiError } from '../../shared/errors/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { CloudinaryService } from '../../shared/integrations/storage/cloudinary.service.js';
import { DISEASE_DETECTION_STATUS } from './disease-detection.constant.js';
import { addDiseaseDetectionJob } from '../../jobs/disease-detection/disease-detection.queue.js';

export const createDiseaseDetection = async (
  userId: Types.ObjectId,
  payload: CreateDiseaseDetectionPayload,
  file: Express.Multer.File
): Promise<DiseaseReport> => {
  const profile = await ProfileRepository.findByUserId(userId);

  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Profile not found.');
  }

  const profileDoc = profile as unknown as {
    _id: Types.ObjectId;
  };

  if (profileDoc._id.toString() !== payload.profileId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to use this profile.');
  }

  if (!file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Disease image is required.');
  }

  const uploadedImage = await CloudinaryService.uploadImage(file.buffer, 'disease-detection');

  try {
    const report = await DiseaseDetectionRepository.create({
      userId,
      profileId: payload.profileId,

      image: {
        url: uploadedImage.url,
        publicId: uploadedImage.publicId!,
      },

      // diagnosisResult: aiResult.diagnosisResult,
      processingStatus: DISEASE_DETECTION_STATUS.COMPLETED,
      requestedAt: new Date(),
      // completedAt: new Date(),
    });

    const reportDoc = report as unknown as {
      _id: Types.ObjectId;
    };

    // AI processing job to BullMQ.
    await addDiseaseDetectionJob({
      reportId: reportDoc._id.toString(),
      userId: userId.toString(),
      profileId: payload.profileId.toString(),

      imageUrl: uploadedImage.url,
      imagePublicId: uploadedImage.publicId!,
    });

    return report;
  } catch (error: unknown) {
    if (uploadedImage.publicId) {
      try {
        await CloudinaryService.deleteImage(uploadedImage.publicId);
      } catch {
        // Do not hide the original AI/database error.
      }
    }
    throw error;
  }
};

const getMyReports = async (userId: Types.ObjectId): Promise<DiseaseReport[]> => {
  return DiseaseDetectionRepository.findByUserId(userId);
};

const getMyReport = async (
  reportId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<DiseaseReport> => {
  const report = await DiseaseDetectionRepository.findByIdAndUserId(reportId, userId);

  if (!report) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Disease report not found.');
  }

  return report;
};

const deleteMyReport = async (reportId: Types.ObjectId, userId: Types.ObjectId): Promise<void> => {
  const report = await DiseaseDetectionRepository.findByIdAndUserId(reportId, userId);

  if (!report) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Disease report not found.');
  }

  if (report.image.publicId) {
    await CloudinaryService.deleteImage(report.image.publicId);
  }

  await DiseaseDetectionRepository.deleteByIdAndUserId(reportId, userId);
};

export const DiseaseDetectionService = {
  createDiseaseDetection,
  getMyReports,
  getMyReport,
  deleteMyReport,
};
