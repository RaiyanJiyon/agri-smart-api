import mongoose from 'mongoose';
import type {
  CropRecommendation,
  CropRecommendationInput,
} from '../../src/app/modules/crop-recommendations/crop-recommendation.interface.js';
import { CROP_RECOMMENDATION_STATUS } from '../../src/app/modules/crop-recommendations/crop-recommendation.constant.js';

export interface MockCropRecommendation extends CropRecommendation {
  _id: mongoose.Types.ObjectId;
}

export const createMockCropRecommendationInput = (
  overrides: Partial<CropRecommendationInput> = {}
): CropRecommendationInput => ({
  location: 'Rangpur, Bangladesh',
  fieldArea: 5,
  soilType: 'Loamy',
  soilPh: 6.5,
  nitrogen: 40,
  phosphorus: 20,
  potassium: 30,
  averageTemperature: 25,
  annualRainfall: 1200,
  ...overrides,
});

export const createMockCropRecommendation = (
  overrides: Partial<MockCropRecommendation> = {}
): MockCropRecommendation => {
  const recommendationId = overrides._id ?? new mongoose.Types.ObjectId();
  const userId = overrides.userId ?? new mongoose.Types.ObjectId();
  const profileId = overrides.profileId ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();

  return {
    _id: recommendationId,
    userId,
    profileId,
    inputParameters: createMockCropRecommendationInput(overrides.inputParameters),
    recommendationResult: {
      recommendedCrops: ['Rice', 'Wheat', 'Maize'],
      explanation: 'Optimal soil pH and balanced NPK ratio for cereal crops.',
      confidence: 0.92,
    },
    processingStatus: CROP_RECOMMENDATION_STATUS.COMPLETED,
    requestedAt: defaultDate,
    completedAt: defaultDate,
    createdAt: defaultDate,
    updatedAt: defaultDate,
    ...overrides,
  };
};

export const createMockCropRecommendationList = (
  count = 2,
  overrides: Partial<MockCropRecommendation> = {}
): MockCropRecommendation[] => {
  return Array.from({ length: count }, () =>
    createMockCropRecommendation({
      ...overrides,
    })
  );
};
