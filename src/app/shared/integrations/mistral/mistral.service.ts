import { Mistral } from '@mistralai/mistralai';
import { config } from '../../config/env.js';
import type {
  MistralChatInput,
  MistralChatOutput,
  MistralCropRecommendationInput,
  MistralCropRecommendationOutput,
  MistralDiseaseDetectionInput,
  MistralDiseaseDetectionOutput,
} from './mistral.interface.js';
import {
  mistralChatResponseSchema,
  mistralCropRecommendationResponseSchema,
  mistralDiseaseDetectionResponseSchema,
} from './mistral.validation.js';

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

const generateDiseaseDetection = async (
  input: MistralDiseaseDetectionInput
): Promise<MistralDiseaseDetectionOutput> => {
  const prompt = `
You are an agricultural plant disease detection assistant.

Analyze the provided plant image and identify the most likely
disease, condition, or health issue visible in the plant.

Return a JSON object with exactly these fields:

{
  "disease": "disease name",
  "explanation": "clear explanation of the visible symptoms and why they indicate this condition",
  "recommendedActions": [
    "action 1",
    "action 2",
    "action 3"
  ],
  "confidence": 0.0
}

Rules:

- Analyze only what can reasonably be inferred from the provided image.
- Do not invent symptoms that are not visible.
- If the image is unclear or insufficient for reliable identification,
  say so in the explanation.
- If the plant appears healthy, clearly indicate that.
- recommendedActions must contain practical general actions.
- Do not claim certainty when the image does not support certainty.
- confidence must be between 0 and 1.
- Return JSON only.
  `;

  const response = await client.chat.complete({
    model: config.AI.MISTRAL_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            imageUrl: input.imageUrl,
          },
        ],
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

  const parsedResponse: unknown = JSON.parse(content);

  return mistralDiseaseDetectionResponseSchema.parse(parsedResponse);
};

const generateChatResponse = async (input: MistralChatInput): Promise<MistralChatOutput> => {
  const messages = [
    {
      role: 'system' as const,
      content: `
You are an agricultural chat assistant.

Respond to the user's message in a helpful and informative way.

Return a JSON object with exactly this field:
{
  "message": "your response text here"
}

Rules:
- Provide useful agricultural information.
- If the user says thank you, expresses gratitude, or uses casual greetings, reply politely and concisely as a helpful assistant without repeating previous lists or data.
- Use the conversation history to understand context.
- Do not invent measurements or facts that were not provided.
- If the available information is insufficient, clearly say so.
- Do not claim certainty when the available information does not support it.
- Return JSON only.
      `.trim(),
    },

    ...input.conversationHistory.map((message) => ({
      role: message.role,
      content: message.content,
    })),

    {
      role: 'user' as const,
      content: input.message,
    },
  ];

  const response = await client.chat.complete({
    model: config.AI.MISTRAL_MODEL,
    messages,
    responseFormat: {
      type: 'json_object',
    },
  });

  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Mistral returned an empty response.');
  }

  const cleanedContent = content.replace(/^```json\s*([\s\S]*?)\s*```$/, '$1').trim();

  const parsedResponse: unknown = JSON.parse(cleanedContent);

  return mistralChatResponseSchema.parse(parsedResponse);
};

export const MistralService = {
  generateCropRecommendation,
  generateDiseaseDetection,
  generateChatResponse,
};
