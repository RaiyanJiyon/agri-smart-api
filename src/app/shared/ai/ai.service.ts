import { MistralService } from '../integrations/mistral/mistral.service.js';
import type {
  AIService,
  CropRecommendationAIInput,
  CropRecommendationAIOutput,
} from './ai.interface.js';

class AIServiceImpl implements AIService {
  async generateCropRecommendation(
    input: CropRecommendationAIInput
  ): Promise<CropRecommendationAIOutput> {
    const result = await MistralService.generateCropRecommendation(input);

    return {
      recommendationResult: {
        recommendedCrops: result.recommendedCrops,
        explanation: result.explanation,
        confidence: result.confidence,
      },
    };
  }
}

export const aiService = new AIServiceImpl();
