import type { Conversation } from '../ai-assistant/conversation/ai-assistant.interface.js';
import type { CropRecommendation } from '../crop-recommendations/crop-recommendation.interface.js';
import type { DiseaseReport } from '../disease-detection/disease-detection.interface.js';
import type { Farm } from '../farm/farm.interface.js';
import type { Profile } from '../profile/profile.interface.js';

export interface DashboardSummary {
  profile: Profile | null;
  farms: Farm[];
  recentRecommendations: CropRecommendation[];
  recentDiseaseReports: DiseaseReport[];
  recentConversations: Conversation[];
}
