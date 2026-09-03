import type { Types } from 'mongoose';
import type { CropRecommendation } from './index.js';
import {
  NotificationService,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
} from '../notification/index.js';

export const safeSendCropRecommendationNotification = async (
  userId: Types.ObjectId,
  report: CropRecommendation
): Promise<void> => {
  try {
    const reportId = (report as unknown as { _id: Types.ObjectId })._id;
    const recommendedCrops = report.recommendationResult?.recommendedCrops ?? [];

    await NotificationService.create({
      userId,
      type: NOTIFICATION_TYPE.CROP_RECOMMENDATION,
      status: NOTIFICATION_STATUS.UNREAD,
      title: 'Crop recommendation completed',
      message: 'Your crop recommendation analysis is ready.',
      metadata: {
        cropRecommendationId: reportId,
        recommendedCrops,
      },
    });
  } catch {
    // Fail silently so it doesn't break the main flow
  }
};
