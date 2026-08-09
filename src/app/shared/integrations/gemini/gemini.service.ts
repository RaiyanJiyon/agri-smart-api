import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../../config/env.js';
import type {
  GeminiCropRecommendationInput,
  GeminiCropRecommendationOutput,
} from './gemini.interface.js';

const ai = new GoogleGenAI({
  apiKey: config.GEMINI.GEMINI_API_KEY,
});

const generateCropRecommendation = async (
  input: GeminiCropRecommendationInput
): Promise<GeminiCropRecommendationOutput> => {
  const prompt = `
You are an agricultural crop recommendation assistant.

Analyze the agricultural information provided below and recommend
suitable crops.

User profile ID:
${input.profileId}

Agricultural input parameters:
${JSON.stringify(input.inputParameters, null, 2)}

Rules:
- Recommend crops that are appropriate for the provided information.
- Explain the reasoning clearly.
- Do not invent measurements that were not provided.
- If the available information is insufficient for a confident recommendation,
  make that clear in the explanation.
- Return only the requested structured JSON response.
`;

  const response = await ai.models.generateContent({
    model: config.GEMINI.GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendedCrops: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
          explanation: {
            type: Type.STRING,
          },
          confidence: {
            type: Type.NUMBER,
            nullable: true,
          },
        },
        required: ['recommendedCrops', 'explanation', 'confidence'],
      },
    },
  });

  if (!response.text) {
    throw new Error('Gemini returned an empty response.');
  }

  const result = JSON.parse(response.text) as GeminiCropRecommendationOutput;

  return result;
};

export const GeminiService = {
  generateCropRecommendation,
};
