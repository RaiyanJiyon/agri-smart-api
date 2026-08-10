import type { Types } from 'mongoose';
import type { DiseaseDetectionStatus } from './disease-detection.constant.js';

export interface DiseaseDiagnosisResult {
  disease: string;
  explanation: string;
  recommendedActions: string[];
  confidence: number | null;
}

export interface DiseaseImage {
  url: string;
  publicId?: string;
}

export interface DiseaseReport {
  userId: Types.ObjectId;
  profileId: Types.ObjectId;

  image: DiseaseImage;

  diagnosisResult?: DiseaseDiagnosisResult;

  processingStatus: DiseaseDetectionStatus;

  requestedAt: Date;
  completedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateDiseaseDetectionPayload {
  profileId: Types.ObjectId;
}
