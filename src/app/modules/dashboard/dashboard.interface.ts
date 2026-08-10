import type { CropRecommendation } from '../crop-recommendations/crop-recommendation.interface.js';
import type { Farm } from '../farm/farm.interface.js';
import type { Profile } from '../profile/profile.interface.js';

export interface DashboardSummary {
  profile: Profile | null;
  farm: Farm[];
  recentRecommendations: CropRecommendation[];
}
