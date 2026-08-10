export const DISEASE_DETECTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type DiseaseDetectionStatus =
  (typeof DISEASE_DETECTION_STATUS)[keyof typeof DISEASE_DETECTION_STATUS];
