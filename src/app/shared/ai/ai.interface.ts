import type { GeminiCropRecommendationOutput } from '../integrations/gemini/gemini.interface.js';

export interface CropRecommendationAIInput {
  profileId: string;
  inputParameters: Record<string, unknown>;
}

export interface CropRecommendationAIOutput {
  recommendationResult: GeminiCropRecommendationOutput;
}

export interface AIService {
  generateCropRecommendation(input: CropRecommendationAIInput): Promise<CropRecommendationAIOutput>;
}
