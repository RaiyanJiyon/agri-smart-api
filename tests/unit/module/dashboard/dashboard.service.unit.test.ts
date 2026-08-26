import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardService } from '../../../../src/app/modules/dashboard/dashboard.service.js';
import { ProfileService } from '../../../../src/app/modules/profile/profile.service.js';
import { FarmService } from '../../../../src/app/modules/farm/farm.service.js';
import { CropRecommendationService } from '../../../../src/app/modules/crop-recommendations/crop-recommendation.service.js';
import { DiseaseDetectionService } from '../../../../src/app/modules/disease-detection/disease-detection.service.js';
import { ConversationService } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.service.js';
import {
  createMockProfile,
  createMockFarmList,
  createMockCropRecommendationList,
  createMockDiseaseReportList,
  createMockConversationList,
} from '../../../fixtures/index.js';

vi.mock('../../../../src/app/modules/profile/profile.service.js', () => ({
  ProfileService: {
    getMyProfile: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/farm/farm.service.js', () => ({
  FarmService: {
    getMyFarms: vi.fn(),
  },
}));

vi.mock(
  '../../../../src/app/modules/crop-recommendations/crop-recommendation.service.js',
  () => ({
    CropRecommendationService: {
      getMyRecommendations: vi.fn(),
    },
  })
);

vi.mock('../../../../src/app/modules/disease-detection/disease-detection.service.js', () => ({
  DiseaseDetectionService: {
    getMyReports: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/ai-assistant/conversation/ai-assistant.service.js', () => ({
  ConversationService: {
    getMyConversations: vi.fn(),
  },
}));

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyDashboard', () => {
    it('should aggregate profile, farms, and top 5 recent recommendations, reports, and conversations', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ userId });
      const farms = createMockFarmList(3, { userId });
      const recommendations = createMockCropRecommendationList(7, { userId });
      const diseaseReports = createMockDiseaseReportList(8, { userId });
      const conversations = createMockConversationList(6, { userId });

      vi.mocked(ProfileService.getMyProfile).mockResolvedValue(profile);
      vi.mocked(FarmService.getMyFarms).mockResolvedValue(farms);
      vi.mocked(CropRecommendationService.getMyRecommendations).mockResolvedValue(recommendations);
      vi.mocked(DiseaseDetectionService.getMyReports).mockResolvedValue(diseaseReports);
      vi.mocked(ConversationService.getMyConversations).mockResolvedValue(conversations);

      const result = await DashboardService.getMyDashboard(userId);

      expect(ProfileService.getMyProfile).toHaveBeenCalledWith(userId);
      expect(FarmService.getMyFarms).toHaveBeenCalledWith(userId);
      expect(CropRecommendationService.getMyRecommendations).toHaveBeenCalledWith(userId);
      expect(DiseaseDetectionService.getMyReports).toHaveBeenCalledWith(userId);
      expect(ConversationService.getMyConversations).toHaveBeenCalledWith(userId);

      expect(result.profile).toEqual(profile);
      expect(result.farms).toEqual(farms);
      expect(result.recentRecommendations).toHaveLength(5);
      expect(result.recentDiseaseReports).toHaveLength(5);
      expect(result.recentConversations).toHaveLength(5);
    });

    it('should handle null profile and empty lists gracefully', async () => {
      const userId = new mongoose.Types.ObjectId();

      vi.mocked(ProfileService.getMyProfile).mockResolvedValue(null);
      vi.mocked(FarmService.getMyFarms).mockResolvedValue([]);
      vi.mocked(CropRecommendationService.getMyRecommendations).mockResolvedValue([]);
      vi.mocked(DiseaseDetectionService.getMyReports).mockResolvedValue([]);
      vi.mocked(ConversationService.getMyConversations).mockResolvedValue([]);

      const result = await DashboardService.getMyDashboard(userId);

      expect(result.profile).toBeNull();
      expect(result.farms).toEqual([]);
      expect(result.recentRecommendations).toEqual([]);
      expect(result.recentDiseaseReports).toEqual([]);
      expect(result.recentConversations).toEqual([]);
    });
  });
});
