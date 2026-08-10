import type { Types } from 'mongoose';
import type { DashboardSummary } from './dashboard.interface.js';
import { ProfileService } from '../profile/profile.service.js';
import { FarmService } from '../farm/farm.service.js';
import { CropRecommendationService } from '../crop-recommendations/crop-recommendation.service.js';

const getMyDashboard = async (userId: Types.ObjectId): Promise<DashboardSummary> => {
  const [profile, farms, recentRecommendations] = await Promise.all([
    ProfileService.getMyProfile(userId),
    FarmService.getMyFarms(userId),
    CropRecommendationService.getMyRecommendations(userId),
  ]);

  return {
    profile,
    farms,
    recentRecommendations,
  };
};

export const DashboardService = {
  getMyDashboard,
};
