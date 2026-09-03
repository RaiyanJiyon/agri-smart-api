import type { Conversation } from '../ai-assistant/index.js';
import type { CropRecommendation } from '../crop-recommendations/index.js';
import type { DiseaseReport } from '../disease-detection/index.js';
import type { Farm } from '../farm/index.js';
import type { Profile } from '../profile/index.js';

export interface DashboardSummary {
  profile: Profile | null;
  farms: Farm[];
  recentRecommendations: CropRecommendation[];
  recentDiseaseReports: DiseaseReport[];
  recentConversations: Conversation[];
}
