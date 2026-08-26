/* eslint-disable @typescript-eslint/unbound-method */
import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageService } from '../../../../src/app/modules/ai-assistant/message/message.service.js';
import { ConversationRepository } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.repository.js';
import { MessageRepository } from '../../../../src/app/modules/ai-assistant/message/message.repository.js';
import { aiService } from '../../../../src/app/shared/ai/ai.service.js';
import { CONVERSATION_STATUS } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.constant.js';
import {
  MESSAGE_ROLE,
  MESSAGE_STATUS,
} from '../../../../src/app/modules/ai-assistant/message/message.constant.js';
import {
  createMockConversation,
  createMockMessage,
  createMockMessageList,
} from '../../../fixtures/index.js';

vi.mock('../../../../src/app/modules/ai-assistant/conversation/ai-assistant.repository.js', () => ({
  ConversationRepository: {
    findByIdAndUserId: vi.fn(),
  },
}));

vi.mock('../../../../src/app/modules/ai-assistant/message/message.repository.js', () => ({
  MessageRepository: {
    create: vi.fn(),
    findByConversationId: vi.fn(),
  },
}));

vi.mock('../../../../src/app/shared/ai/ai.service.js', () => ({
  aiService: {
    generateChatResponse: vi.fn(),
  },
}));

describe('MessageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should save user message, query history, call AI service, and save assistant response', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      const conversation = createMockConversation({
        _id: conversationId,
        userId,
        status: CONVERSATION_STATUS.ACTIVE,
      });

      const previousMessage = createMockMessage({
        conversationId,
        role: MESSAGE_ROLE.USER,
        content: 'Hi',
      });

      const userMessage = createMockMessage({
        conversationId,
        role: MESSAGE_ROLE.USER,
        content: 'How to control pests?',
      });

      const assistantMessage = createMockMessage({
        conversationId,
        role: MESSAGE_ROLE.ASSISTANT,
        content: 'Use organic neem oil spray.',
      });

      vi.mocked(ConversationRepository.findByIdAndUserId).mockResolvedValue(conversation);
      vi.mocked(MessageRepository.findByConversationId).mockResolvedValue([previousMessage]);
      vi.mocked(MessageRepository.create)
        .mockResolvedValueOnce(userMessage)
        .mockResolvedValueOnce(assistantMessage);

      vi.mocked(aiService.generateChatResponse).mockResolvedValue({
        message: 'Use organic neem oil spray.',
      });

      const result = await MessageService.sendMessage(userId, conversationId, {
        content: 'How to control pests?',
      });

      expect(result).toEqual({
        userMessage,
        assistantMessage,
      });

      expect(ConversationRepository.findByIdAndUserId).toHaveBeenCalledWith(conversationId, userId);
      expect(MessageRepository.findByConversationId).toHaveBeenCalledWith(conversationId, {
        limit: 20,
        sort: { createdAt: -1 },
      });

      expect(MessageRepository.create).toHaveBeenNthCalledWith(1, {
        conversationId,
        role: MESSAGE_ROLE.USER,
        content: 'How to control pests?',
        status: MESSAGE_STATUS.COMPLETED,
      });

      expect(aiService.generateChatResponse).toHaveBeenCalledWith({
        userId: userId.toString(),
        conversationId: conversationId.toString(),
        message: 'How to control pests?',
        conversationHistory: [{ role: previousMessage.role, content: previousMessage.content }],
      });

      expect(MessageRepository.create).toHaveBeenNthCalledWith(2, {
        conversationId,
        role: MESSAGE_ROLE.ASSISTANT,
        content: 'Use organic neem oil spray.',
        status: MESSAGE_STATUS.COMPLETED,
      });
    });

    it('should throw NOT_FOUND when conversation does not exist or belongs to another user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();

      vi.mocked(ConversationRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(
        MessageService.sendMessage(userId, conversationId, { content: 'Hello' })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Conversation not found.',
      });

      expect(MessageRepository.create).not.toHaveBeenCalled();
      expect(aiService.generateChatResponse).not.toHaveBeenCalled();
    });

    it('should throw BAD_REQUEST when attempting to send message to a completed conversation', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      const conversation = createMockConversation({
        _id: conversationId,
        userId,
        status: CONVERSATION_STATUS.COMPLETED,
      });

      vi.mocked(ConversationRepository.findByIdAndUserId).mockResolvedValue(conversation);

      await expect(
        MessageService.sendMessage(userId, conversationId, { content: 'Hello' })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Cannot send messages to a completed conversation.',
      });

      expect(MessageRepository.create).not.toHaveBeenCalled();
    });

    it('should create FAILED assistant message and rethrow error when AI service fails', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      const conversation = createMockConversation({
        _id: conversationId,
        userId,
        status: CONVERSATION_STATUS.ACTIVE,
      });

      const userMessage = createMockMessage({
        conversationId,
        role: MESSAGE_ROLE.USER,
        content: 'Pest control advice',
      });

      vi.mocked(ConversationRepository.findByIdAndUserId).mockResolvedValue(conversation);
      vi.mocked(MessageRepository.findByConversationId).mockResolvedValue([]);
      vi.mocked(MessageRepository.create).mockResolvedValue(userMessage);

      vi.mocked(aiService.generateChatResponse).mockRejectedValue(new Error('AI API Error'));

      await expect(
        MessageService.sendMessage(userId, conversationId, { content: 'Pest control advice' })
      ).rejects.toThrow('AI API Error');

      expect(MessageRepository.create).toHaveBeenNthCalledWith(2, {
        conversationId,
        role: MESSAGE_ROLE.ASSISTANT,
        content: 'Unable to generate a response at this time.',
        status: MESSAGE_STATUS.FAILED,
      });
    });
  });

  describe('getConversationMessages', () => {
    it('should return all messages belonging to conversation when owned by user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      const conversation = createMockConversation({ _id: conversationId, userId });
      const messages = createMockMessageList(2, { conversationId });

      vi.mocked(ConversationRepository.findByIdAndUserId).mockResolvedValue(conversation);
      vi.mocked(MessageRepository.findByConversationId).mockResolvedValue(messages);

      const result = await MessageService.getConversationMessages(userId, conversationId);

      expect(result).toEqual(messages);
      expect(MessageRepository.findByConversationId).toHaveBeenCalledWith(conversationId);
    });

    it('should throw NOT_FOUND when accessing messages of non-existent or unowned conversation', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();

      vi.mocked(ConversationRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(
        MessageService.getConversationMessages(userId, conversationId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Conversation not found.',
      });

      expect(MessageRepository.findByConversationId).not.toHaveBeenCalled();
    });
  });
});
