import { Mistral } from '@mistralai/mistralai';
import { config } from '../../config/env.js';
import type {
  MistralCropRecommendationInput,
  MistralCropRecommendationOutput,
} from './mistral.interface.js';
import { mistralCropRecommendationResponseSchema } from './mistral.validation.js';

const client = new Mistral({
  apiKey: config.AI.MISTRAL_API_KEY,
});

const generateCropRecommendation = async (
  input: MistralCropRecommendationInput
): Promise<MistralCropRecommendationOutput> => {
  const prompt = `
You are an agricultural crop recommendation assistant.

Analyze the agricultural information provided below and recommend
suitable crops.

Agricultural input parameters:
${JSON.stringify(input.inputParameters, null, 2)}

Return a JSON object with exactly these fields:

{
  "recommendedCrops": ["crop name"],
  "explanation": "clear explanation",
  "confidence": 0.0
}

Rules:
- Recommend crops appropriate for the provided information.
- Explain why the crops are suitable.
- Do not invent measurements that were not provided.
- If the information is insufficient for a confident recommendation,
  explain the limitation.
- confidence must be between 0 and 1.
- Return JSON only.
`;

  const response = await client.chat.complete({
    model: config.AI.MISTRAL_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    responseFormat: {
      type: 'json_object',
    },
  });

  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Mistral returned an empty response.');
  }

  // Sanitize content in case the LLM wraps the JSON in markdown code blocks
  const cleanedContent = content.replace(/^```json\s*([\s\S]*?)\s*```$/, '$1').trim();

  const parsedResponse: unknown = JSON.parse(cleanedContent);

  return mistralCropRecommendationResponseSchema.parse(parsedResponse);
};

export const MistralService = {
  generateCropRecommendation,
};
