import type { Types } from 'mongoose';
import type { DashboardSummary } from './dashboard.interface.js';
import { ProfileService } from '../profile/index.js';
import { FarmService } from '../farm/index.js';
import { CropRecommendationService } from '../crop-recommendations/index.js';
import { DiseaseDetectionService } from '../disease-detection/index.js';
import { ConversationService } from '../ai-assistant/index.js';

const getMyDashboard = async (userId: Types.ObjectId): Promise<DashboardSummary> => {
  const [profile, farms, recentRecommendations, recentDiseaseReports, recentConversations] =
    await Promise.all([
      ProfileService.getMyProfile(userId),
      FarmService.getMyFarms(userId),
      CropRecommendationService.getMyRecommendations(userId),
      DiseaseDetectionService.getMyReports(userId),
      ConversationService.getMyConversations(userId),
    ]);

  return {
    profile,
    farms,
    recentRecommendations: recentRecommendations.slice(0, 5),
    recentDiseaseReports: recentDiseaseReports.slice(0, 5),
    recentConversations: recentConversations.slice(0, 5),
  };
};

export const DashboardService = {
  getMyDashboard,
};
