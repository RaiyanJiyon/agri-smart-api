import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safeSendCropRecommendationNotification } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.helper.js';
import { NotificationService } from '../../../../src/app/modules/notification/notification.service.js';
import type { CropRecommendation } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.interface.js';
import type { Notification } from '../../../../src/app/modules/notification/notification.interface.js';

vi.mock('../../../../src/app/modules/notification/notification.service.js', () => ({
  NotificationService: {
    create: vi.fn(),
  },
}));

describe('crop-recommendation.helper', () => {
  const userId = new mongoose.Types.ObjectId();
  const reportId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create notification successfully for crop recommendation', async () => {
    const mockNotification = {
      _id: new mongoose.Types.ObjectId(),
      userId,
    } as unknown as Notification;

    vi.mocked(NotificationService.create).mockResolvedValueOnce(mockNotification);

    const report = {
      _id: reportId,
      recommendationResult: {
        recommendedCrops: [
          { name: 'Wheat', suitabilityScore: 0.9, season: 'Rabi', reasoning: 'Good' },
        ],
      },
    } as unknown as CropRecommendation;

    await safeSendCropRecommendationNotification(userId, report);

    expect(NotificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        title: 'Crop recommendation completed',
      })
    );
  });

  it('should handle undefined recommendedCrops gracefully', async () => {
    const mockNotification = {
      _id: new mongoose.Types.ObjectId(),
      userId,
    } as unknown as Notification;

    vi.mocked(NotificationService.create).mockResolvedValueOnce(mockNotification);

    const report = {
      _id: reportId,
    } as unknown as CropRecommendation;

    await safeSendCropRecommendationNotification(userId, report);

    expect(NotificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        metadata: {
          cropRecommendationId: reportId,
          recommendedCrops: [],
        },
      })
    );
  });

  it('should swallow errors silently when notification creation fails', async () => {
    vi.mocked(NotificationService.create).mockRejectedValueOnce(new Error('Notification error'));

    const report = {
      _id: reportId,
    } as unknown as CropRecommendation;

    await expect(safeSendCropRecommendationNotification(userId, report)).resolves.toBeUndefined();
  });
});
