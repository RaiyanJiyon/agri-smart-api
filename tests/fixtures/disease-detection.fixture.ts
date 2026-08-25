import mongoose from 'mongoose';
import type { DiseaseReport } from '../../src/app/modules/disease-detection/disease-detection.interface.js';
import { DISEASE_DETECTION_STATUS } from '../../src/app/modules/disease-detection/disease-detection.constant.js';

export interface MockDiseaseReport extends DiseaseReport {
  _id: mongoose.Types.ObjectId;
}

export const createMockDiseaseReport = (
  overrides: Partial<MockDiseaseReport> = {}
): MockDiseaseReport => {
  const reportId = overrides._id ?? new mongoose.Types.ObjectId();
  const userId = overrides.userId ?? new mongoose.Types.ObjectId();
  const profileId = overrides.profileId ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();

  return {
    _id: reportId,
    userId,
    profileId,
    image: {
      url: 'https://res.cloudinary.com/demo/image/upload/v123456789/disease-detection/sample.jpg',
      publicId: 'disease-detection/sample',
    },
    diagnosisResult: {
      disease: 'Late Blight',
      explanation: 'Fungal infection affecting tomato leaves characterized by dark lesions.',
      recommendedActions: [
        'Apply copper-based fungicide',
        'Remove and destroy infected leaves',
        'Avoid overhead watering',
      ],
      confidence: 0.94,
    },
    processingStatus: DISEASE_DETECTION_STATUS.COMPLETED,
    requestedAt: defaultDate,
    completedAt: defaultDate,
    createdAt: defaultDate,
    updatedAt: defaultDate,
    ...overrides,
  };
};

export const createMockDiseaseReportList = (
  count = 2,
  overrides: Partial<MockDiseaseReport> = {}
): MockDiseaseReport[] => {
  return Array.from({ length: count }, () =>
    createMockDiseaseReport({
      ...overrides,
    })
  );
};
