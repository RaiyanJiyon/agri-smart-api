import type { CropRecommendationInput } from '../../modules/crop-recommendations/index.js';

export interface CropRecommendationAIInput {
  profileId: string;
  inputParameters: CropRecommendationInput;
}

export interface CropRecommendationAIOutput {
  recommendationResult: {
    recommendedCrops: string[];
    explanation: string;
    confidence: number | null;
  };
}

export interface DiseaseDetectionAIInput {
  imageUrl: string;
}

export interface DiseaseDetectionAIOutput {
  diagnosisResult: {
    disease: string;
    explanation: string;
    recommendedActions: string[];
    confidence: number | null;
  };
}

export interface AIChatInput {
  conversationId: string;

  message: string;

  conversationHistory: {
    role: 'user' | 'assistant';
    content: string;
  }[];
}

export interface AIChatOutput {
  message: string;
}

export interface AIService {
  generateCropRecommendation(input: CropRecommendationAIInput): Promise<CropRecommendationAIOutput>;

  generateDiseaseDetection(input: DiseaseDetectionAIInput): Promise<DiseaseDetectionAIOutput>;

  generateChatResponse(input: AIChatInput): Promise<AIChatOutput>;
}
