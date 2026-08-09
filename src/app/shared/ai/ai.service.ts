import { GeminiService } from '../integrations/gemini/gemini.service.js';
import type {
  AIService,
  CropRecommendationAIInput,
  CropRecommendationAIOutput,
} from './ai.interface.js';

class AIServiceImpl implements AIService {
  async generateCropRecommendation(
    input: CropRecommendationAIInput
  ): Promise<CropRecommendationAIOutput> {
    const result = await GeminiService.generateCropRecommendation(input);

    return {
      recommendationResult: result,
    };
  }
}

export const aiService = new AIServiceImpl();
