import z from 'zod';

export const sendMessageValidationSchema = z.object({
  params: z
    .object({
      conversationId: z.string().min(1, 'Conversation ID is required.'),
    })
    .strict(),

  body: z
    .object({
      content: z
        .string()
        .trim()
        .min(1, 'Message content is required.')
        .max(5000, 'Message content cannot exceed 5000 characters.'),
    })
    .strict(),
});

export const conversationMessagesValidationSchema = z.object({
  params: z
    .object({
      conversationId: z.string().min(1, 'Conversation ID is required.'),
    })
    .strict(),
});
