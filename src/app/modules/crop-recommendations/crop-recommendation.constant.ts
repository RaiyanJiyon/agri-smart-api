export const CROP_RECOMMENDATION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type CropRecommendationStatus =
  (typeof CROP_RECOMMENDATION_STATUS)[keyof typeof CROP_RECOMMENDATION_STATUS];
