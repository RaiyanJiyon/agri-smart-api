import { model, Schema } from 'mongoose';
import type { CropRecommendation } from './crop-recommendation.interface.js';
import { COLLECTION_NAME } from '../../shared/constants/database.js';
import { CROP_RECOMMENDATION_STATUS } from './crop-recommendation.constant.js';

const CropRecommendationSchema = new Schema<CropRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.PROFILE,
      required: true,
    },
    inputParameters: {
      type: Schema.Types.Mixed,
      required: true,
    },
    recommendationResult: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    processingStatus: {
      type: String,
      enum: Object.values(CROP_RECOMMENDATION_STATUS),
      default: CROP_RECOMMENDATION_STATUS.PENDING,
      required: true,
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Supports user's recommendation history ordered by newest request.
CropRecommendationSchema.index({
  userId: 1,
  requestedAt: -1,
});

// Supports filtering recommendations by processing status.
CropRecommendationSchema.index({
  processingStatus: 1,
});

export const CropRecommendationModel = model<CropRecommendation>(
  COLLECTION_NAME.CROP_RECOMMENDATION,
  CropRecommendationSchema
);
