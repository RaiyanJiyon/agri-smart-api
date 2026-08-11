import z from 'zod';
import { CONVERSATION_STATUS } from './ai-assistant.constant.js';

const conversationIdSchema = z.string().min(1, 'Conversation ID is required.');

export const createConversationValidationSchema = z.object({
  body: z
    .object({
      profileId: z.string().min(1, 'Profile ID is required.').optional(),

      title: z
        .string()
        .trim()
        .min(1, 'Conversation title is required.')
        .max(200, 'Conversation title cannot exceed 200 characters.'),
    })
    .strict(),
});

export const updateConversationValidationSchema = z.object({
  params: z
    .object({
      conversationId: conversationIdSchema,
    })
    .strict(),

  body: z
    .object({
      title: z
        .string()
        .trim()
        .min(1, 'Conversation title is required.')
        .max(200, 'Conversation title cannot exceed 200 characters.')
        .optional(),

      status: z.enum([CONVERSATION_STATUS.ACTIVE, CONVERSATION_STATUS.COMPLETED]).optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 0, 'At least one field is required for update.'),
});

export const conversationIdValidationSchema = z.object({
  params: z
    .object({
      conversationId: conversationIdSchema,
    })
    .strict(),
});
