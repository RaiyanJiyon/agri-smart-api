import type { Types } from 'mongoose';
import type { Message, SendMessagePayload } from './message.interface.js';
import { ConversationRepository } from '../conversation/ai-assistant.repository.js';
import { ApiError } from '../../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../../shared/constants/httpStatus.js';
import { MessageRepository } from './message.repository.js';
import { MESSAGE_ROLE, MESSAGE_STATUS } from './message.constant.js';
import { aiService } from '../../../shared/ai/ai.service.js';
import { CONVERSATION_STATUS } from '../conversation/ai-assistant.constant.js';

const sendMessage = async (
  userId: Types.ObjectId,
  conversationId: Types.ObjectId,
  payload: SendMessagePayload
): Promise<{
  userMessage: Message;
  assistantMessage: Message;
}> => {
  /*
   * Verify that the conversation belongs to the authenticated user.
   */
  const conversation = await ConversationRepository.findByIdAndUserId(conversationId, userId);

  if (!conversation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Conversation not found.');
  }

  /*
   * Do not allow messages in a completed conversation.
   */
  if (conversation.status !== CONVERSATION_STATUS.ACTIVE) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Cannot send messages to a completed conversation.'
    );
  }

/*
   * Load previous messages with a pagination limit (last 20 messages).
   */
  const previousMessagesQuery = await MessageRepository.findByConversationId(conversationId, {
    limit: 20,
    sort: { createdAt: -1 },
  });

  const previousMessages = previousMessagesQuery.reverse(); // Reverse to get chronological order

  /*
   * Save the user's message.
   */
  const userMessage = await MessageRepository.create({
    conversationId,
    role: MESSAGE_ROLE.USER,
    content: payload.content,
    status: MESSAGE_STATUS.COMPLETED,
  });

  /*
   * Convert database messages into AI conversation history.
   */
  const conversationHistory = previousMessages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  /*
   * Ask the AI service to generate the response.
   */
  let aiResult;

  try {
    aiResult = await aiService.generateChatResponse({
      userId: userId.toString(),
      conversationId: conversationId.toString(),
      message: payload.content,
      conversationHistory,
    });
  } catch (error) {
    /*
     * The user's message has already been saved.
     *
     * We don't delete it if AI generation fails because the
     * message itself is valid and can be useful for debugging
     * and future retry functionality.
     */

    await MessageRepository.create({
      conversationId,
      role: MESSAGE_ROLE.ASSISTANT,
      content: 'Unable to generate a response at this time.',
      status: MESSAGE_STATUS.FAILED,
    });

    throw error;
  }

  /*
   * Save the assistant's response.
   */
  const assistantMessage = await MessageRepository.create({
    conversationId,
    role: MESSAGE_ROLE.ASSISTANT,
    content: aiResult.message,
    status: MESSAGE_STATUS.COMPLETED,
  });

  return {
    userMessage,
    assistantMessage,
  };
};

const getConversationMessages = async (
  userId: Types.ObjectId,
  conversationId: Types.ObjectId
): Promise<Message[]> => {
  /*
   * Verify conversation ownership before exposing messages.
   */
  const conversation = await ConversationRepository.findByIdAndUserId(conversationId, userId);

  if (!conversation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Conversation not found.');
  }

  return MessageRepository.findByConversationId(conversationId);
};

export const MessageService = {
  sendMessage,
  getConversationMessages,
};
