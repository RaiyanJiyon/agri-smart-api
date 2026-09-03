import type { Types } from 'mongoose';
import {
  NotificationService,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
} from '../notification/index.js';
import type { DiseaseReport } from './disease-detection.interface.js';

export const safeSendDiseaseDetectionNotification = async (
  userId: Types.ObjectId,
  report: DiseaseReport
): Promise<void> => {
  try {
    await NotificationService.create({
      userId,
      type: NOTIFICATION_TYPE.DISEASE_DETECTION,
      status: NOTIFICATION_STATUS.UNREAD,
      title: 'Disease detection completed',
      message: 'Your plant disease analysis is ready.',
      metadata: {
        diseaseReportId: (report as unknown as { _id: Types.ObjectId })._id,
        disease: report.diagnosisResult?.disease,
      },
    });
  } catch {
    // Fail silently so it doesn't break the main flow
  }
};
