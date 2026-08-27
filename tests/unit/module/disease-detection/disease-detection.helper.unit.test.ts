import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safeSendDiseaseDetectionNotification } from '../../../../src/app/modules/disease-detection/disease-detection.helper.js';
import { NotificationService } from '../../../../src/app/modules/notification/notification.service.js';
import type { DiseaseReport } from '../../../../src/app/modules/disease-detection/disease-detection.interface.js';
import type { Notification } from '../../../../src/app/modules/notification/notification.interface.js';

vi.mock('../../../../src/app/modules/notification/notification.service.js', () => ({
  NotificationService: {
    create: vi.fn(),
  },
}));

describe('disease-detection.helper', () => {
  const userId = new mongoose.Types.ObjectId();
  const reportId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create notification successfully', async () => {
    const mockNotification = {
      _id: new mongoose.Types.ObjectId(),
      userId,
    } as unknown as Notification;

    vi.mocked(NotificationService.create).mockResolvedValueOnce(mockNotification);

    const report = {
      _id: reportId,
      diagnosisResult: { disease: 'Early Blight' },
    } as unknown as DiseaseReport;

    await safeSendDiseaseDetectionNotification(userId, report);

    expect(NotificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        title: 'Disease detection completed',
      })
    );
  });

  it('should swallow errors silently when notification fails', async () => {
    vi.mocked(NotificationService.create).mockRejectedValueOnce(new Error('DB failure'));

    const report = {
      _id: reportId,
      diagnosisResult: { disease: 'Early Blight' },
    } as unknown as DiseaseReport;

    await expect(
      safeSendDiseaseDetectionNotification(userId, report)
    ).resolves.toBeUndefined();
  });
});
