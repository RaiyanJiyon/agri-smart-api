import { MistralService } from '../integrations/mistral/mistral.service.js';
import type {
  AIChatInput,
  AIChatOutput,
  AIService,
  CropRecommendationAIInput,
  CropRecommendationAIOutput,
  DiseaseDetectionAIInput,
  DiseaseDetectionAIOutput,
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

  async generateDiseaseDetection(
    input: DiseaseDetectionAIInput
  ): Promise<DiseaseDetectionAIOutput> {
    const result = await MistralService.generateDiseaseDetection(input);

    return {
      diagnosisResult: {
        disease: result.disease,
        explanation: result.explanation,
        recommendedActions: result.recommendedActions,
        confidence: result.confidence,
      },
    };
  }

  async generateChatResponse(input: AIChatInput): Promise<AIChatOutput> {
    const result = await MistralService.generateChatResponse(input);

    return {
      message: result.message,
    };
  }
}

export const aiService = new AIServiceImpl();
