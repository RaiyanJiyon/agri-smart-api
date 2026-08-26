import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ConversationRepository } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.repository.js';
import { ConversationModel } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.model.js';
import { CONVERSATION_STATUS } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.constant.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';
import type { Conversation } from '../../../../src/app/modules/ai-assistant/conversation/ai-assistant.interface.js';

describe('ConversationRepository integration', () => {
  let userId: mongoose.Types.ObjectId;
  let anotherUserId: mongoose.Types.ObjectId;
  let profileId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    userId = new mongoose.Types.ObjectId();
    anotherUserId = new mongoose.Types.ObjectId();
    profileId = new mongoose.Types.ObjectId();
  });

  describe('create', () => {
    it('should create a conversation document in MongoDB', async () => {
      const payload = {
        title: 'Irrigation Strategy',
        profileId,
      };

      const result = (await ConversationRepository.create(userId, payload)) as Conversation & {
        _id: mongoose.Types.ObjectId;
      };

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.userId.toString()).toBe(userId.toString());
      expect(result.title).toBe('Irrigation Strategy');
      expect(result.status).toBe(CONVERSATION_STATUS.ACTIVE);
      expect(result.lastActivityAt).toBeDefined();

      const stored = await ConversationModel.findById(result._id);
      expect(stored).not.toBeNull();
      expect(stored?.title).toBe('Irrigation Strategy');
    });
  });

  describe('findByUserId', () => {
    it('should return conversations sorted by lastActivityAt descending', async () => {
      const first = await ConversationModel.create({
        userId,
        title: 'Older Conversation',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(Date.now() - 10_000),
      });

      const second = await ConversationModel.create({
        userId,
        title: 'Newer Conversation',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const result = (await ConversationRepository.findByUserId(userId)) as (Conversation & {
        _id: mongoose.Types.ObjectId;
      })[];

      expect(result).toHaveLength(2);
      expect(result[0]?._id.toString()).toBe(second._id.toString());
      expect(result[1]?._id.toString()).toBe(first._id.toString());
    });

    it('should isolate conversations belonging to other users', async () => {
      await ConversationModel.create({
        userId,
        title: 'User Conversation',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      await ConversationModel.create({
        userId: anotherUserId,
        title: 'Another User Conversation',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const result = await ConversationRepository.findByUserId(userId);

      expect(result).toHaveLength(1);
      expect(result[0]?.userId.toString()).toBe(userId.toString());
    });
  });

  describe('findByIdAndUserId', () => {
    it('should return conversation when conversationId and userId match', async () => {
      const created = await ConversationModel.create({
        userId,
        title: 'Crop Planning',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const result = await ConversationRepository.findByIdAndUserId(created._id, userId);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Crop Planning');
    });

    it('should return null when conversation belongs to another user', async () => {
      const created = await ConversationModel.create({
        userId,
        title: 'Crop Planning',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const result = await ConversationRepository.findByIdAndUserId(created._id, anotherUserId);

      expect(result).toBeNull();
    });
  });

  describe('updateByIdAndUserId', () => {
    it('should update conversation title and status', async () => {
      const created = await ConversationModel.create({
        userId,
        title: 'Initial Title',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(Date.now() - 1000),
      });

      const updated = await ConversationRepository.updateByIdAndUserId(created._id, userId, {
        title: 'Updated Title',
        status: CONVERSATION_STATUS.COMPLETED,
      });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe(CONVERSATION_STATUS.COMPLETED);
    });

    it('should return null when updating conversation owned by another user', async () => {
      const created = await ConversationModel.create({
        userId,
        title: 'Initial Title',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const updated = await ConversationRepository.updateByIdAndUserId(created._id, anotherUserId, {
        title: 'Updated Title',
      });

      expect(updated).toBeNull();
    });
  });

  describe('softDeleteByIdAndUserId', () => {
    it('should set status to completed when soft deleting', async () => {
      const created = await ConversationModel.create({
        userId,
        title: 'Active Chat',
        status: CONVERSATION_STATUS.ACTIVE,
        lastActivityAt: new Date(),
      });

      const softDeleted = await ConversationRepository.softDeleteByIdAndUserId(created._id, userId);

      expect(softDeleted).not.toBeNull();
      expect(softDeleted?.status).toBe(CONVERSATION_STATUS.COMPLETED);

      const stored = await ConversationModel.findById(created._id);
      expect(stored?.status).toBe(CONVERSATION_STATUS.COMPLETED);
    });
  });
});
