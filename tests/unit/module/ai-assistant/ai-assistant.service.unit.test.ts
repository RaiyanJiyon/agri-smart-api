import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConversationService } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.service.js';
import { ConversationRepository } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.repository.js';
import { ProfileRepository } from '../../../../src/app/modules/profile/profile.repository.js';
import { CONVERSATION_STATUS } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.constant.js';
import {
  createMockProfile,
  createMockConversation,
  createMockConversationList,
} from '../../../fixtures/index.js';

vi.mock(
  '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.repository.js',
  () => ({
    ConversationRepository: {
      create: vi.fn(),
      findByUserId: vi.fn(),
      findByIdAndUserId: vi.fn(),
      updateByIdAndUserId: vi.fn(),
      softDeleteByIdAndUserId: vi.fn(),
    },
  })
);

vi.mock('../../../../src/app/modules/profile/profile.repository.js', () => ({
  ProfileRepository: {
    findByUserId: vi.fn(),
  },
}));

describe('ConversationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create a conversation successfully when no profileId is provided', async () => {
      const userId = new mongoose.Types.ObjectId();
      const payload = { title: 'General Crop Query' };

      const createdConversation = createMockConversation({
        userId,
        title: 'General Crop Query',
      });

      vi.mocked(ConversationRepository.create).mockResolvedValue(createdConversation);

      const result = await ConversationService.createConversation(userId, payload);

      expect(result).toEqual(createdConversation);
      expect(ConversationRepository.create).toHaveBeenCalledWith(userId, payload);
      expect(ProfileRepository.findByUserId).not.toHaveBeenCalled();
    });

    it('should create a conversation successfully when valid owned profileId is provided', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ _id: profileId, userId });
      const payload = { profileId, title: 'Fertilizer Advice' };

      const createdConversation = createMockConversation({
        userId,
        profileId,
        title: 'Fertilizer Advice',
      });

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);
      vi.mocked(ConversationRepository.create).mockResolvedValue(createdConversation);

      const result = await ConversationService.createConversation(userId, payload);

      expect(result).toEqual(createdConversation);
      expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(ConversationRepository.create).toHaveBeenCalledWith(userId, payload);
    });

    it('should throw NOT_FOUND when provided profileId does not exist', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(null);

      await expect(
        ConversationService.createConversation(userId, { profileId, title: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Profile not found.',
      });

      expect(ConversationRepository.create).not.toHaveBeenCalled();
    });

    it('should throw FORBIDDEN when user tries to use another user profileId', async () => {
      const userId = new mongoose.Types.ObjectId();
      const profileId = new mongoose.Types.ObjectId();
      const otherProfileId = new mongoose.Types.ObjectId();
      const profile = createMockProfile({ _id: profileId, userId });

      vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);

      await expect(
        ConversationService.createConversation(userId, { profileId: otherProfileId, title: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 403,
        message: 'You do not have permission to use this profile.',
      });

      expect(ConversationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getMyConversations', () => {
    it('should return user conversations sorted by lastActivityAt', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversations = createMockConversationList(2, { userId });

      vi.mocked(ConversationRepository.findByUserId).mockResolvedValue(conversations);

      const result = await ConversationService.getMyConversations(userId);

      expect(result).toEqual(conversations);
      expect(ConversationRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getMyConversation', () => {
    it('should return conversation when found for user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      const conversation = createMockConversation({ _id: conversationId, userId });

      vi.mocked(ConversationRepository.findByIdAndUserId).mockResolvedValue(conversation);

      const result = await ConversationService.getMyConversation(conversationId, userId);

      expect(result).toEqual(conversation);
      expect(ConversationRepository.findByIdAndUserId).toHaveBeenCalledWith(conversationId, userId);
    });

    it('should throw NOT_FOUND when conversation does not exist or belong to another user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();

      vi.mocked(ConversationRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(
        ConversationService.getMyConversation(conversationId, userId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Conversation not found.',
      });
    });
  });

  describe('updateMyConversation', () => {
    it('should update conversation title and status successfully', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      const payload = { title: 'Updated Title', status: CONVERSATION_STATUS.COMPLETED };
      const updatedConversation = createMockConversation({
        _id: conversationId,
        userId,
        ...payload,
      });

      vi.mocked(ConversationRepository.updateByIdAndUserId).mockResolvedValue(updatedConversation);

      const result = await ConversationService.updateMyConversation(
        conversationId,
        userId,
        payload
      );

      expect(result).toEqual(updatedConversation);
      expect(ConversationRepository.updateByIdAndUserId).toHaveBeenCalledWith(
        conversationId,
        userId,
        payload
      );
    });

    it('should throw NOT_FOUND when updating non-existent or unowned conversation', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();

      vi.mocked(ConversationRepository.updateByIdAndUserId).mockResolvedValue(null);

      await expect(
        ConversationService.updateMyConversation(conversationId, userId, { title: 'New' })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Conversation not found.',
      });
    });
  });

  describe('deleteMyConversation', () => {
    it('should soft delete conversation when found', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();
      const conversation = createMockConversation({
        _id: conversationId,
        userId,
        status: CONVERSATION_STATUS.COMPLETED,
      });

      vi.mocked(ConversationRepository.softDeleteByIdAndUserId).mockResolvedValue(conversation);

      await ConversationService.deleteMyConversation(conversationId, userId);

      expect(ConversationRepository.softDeleteByIdAndUserId).toHaveBeenCalledWith(
        conversationId,
        userId
      );
    });

    it('should throw NOT_FOUND when soft deleting non-existent conversation', async () => {
      const userId = new mongoose.Types.ObjectId();
      const conversationId = new mongoose.Types.ObjectId();

      vi.mocked(ConversationRepository.softDeleteByIdAndUserId).mockResolvedValue(null);

      await expect(
        ConversationService.deleteMyConversation(conversationId, userId)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Conversation not found.',
      });
    });
  });
});
