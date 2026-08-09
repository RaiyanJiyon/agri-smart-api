import type {
  AIService,
  CropRecommendationAIInput,
  CropRecommendationAIOutput,
} from './ai.interface.js';

class AIServiceImpl implements AIService {
  generateCropRecommendation(
    _input: CropRecommendationAIInput
  ): Promise<CropRecommendationAIOutput> {
    throw new Error('Crop recommendation AI integration has not been implemented yet.');
  }
}

export const aiService = new AIServiceImpl();
