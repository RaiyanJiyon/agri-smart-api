import { model, Schema } from 'mongoose';
import type {
  DiseaseDiagnosisResult,
  DiseaseImage,
  DiseaseReport,
} from './disease-detection.interface.js';
import { DISEASE_DETECTION_STATUS } from './disease-detection.constant.js';
import { COLLECTION_NAME } from '../../shared/constants/database.js';

const diseaseDiagnosisResultSchema = new Schema<DiseaseDiagnosisResult>(
  {
    disease: {
      type: String,
      required: true,
      trim: true,
    },

    explanation: {
      type: String,
      required: true,
      trim: true,
    },

    recommendedActions: {
      type: [String],
      required: true,
      default: [],
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const diseaseImageSchema = new Schema<DiseaseImage>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const diseaseReportSchema = new Schema<DiseaseReport>(
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
      index: true,
    },

    image: {
      type: diseaseImageSchema,
      required: true,
    },

    diagnosisResult: {
      type: diseaseDiagnosisResultSchema,
    },

    processingStatus: {
      type: String,
      enum: Object.values(DISEASE_DETECTION_STATUS),
      required: true,
      default: DISEASE_DETECTION_STATUS.PENDING,
      index: true,
    },

    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const DiseaseReportModel = model<DiseaseReport>(
  COLLECTION_NAME.DISEASE_REPORT,
  diseaseReportSchema
);
