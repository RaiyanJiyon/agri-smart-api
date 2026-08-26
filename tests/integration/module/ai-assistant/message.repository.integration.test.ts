import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { MessageRepository } from '../../../../src/app/modules/ai-assistant/message/message.repository.js';
import { MessageModel } from '../../../../src/app/modules/ai-assistant/message/message.model.js';
import {
  MESSAGE_ROLE,
  MESSAGE_STATUS,
} from '../../../../src/app/modules/ai-assistant/message/message.constant.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';
import type { Message } from '../../../../src/app/modules/ai-assistant/message/message.interface.js';

describe('MessageRepository integration', () => {
  let conversationId: mongoose.Types.ObjectId;
  let anotherConversationId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    conversationId = new mongoose.Types.ObjectId();
    anotherConversationId = new mongoose.Types.ObjectId();
  });

  describe('create', () => {
    it('should create a message document in MongoDB', async () => {
      const payload = {
        conversationId,
        role: MESSAGE_ROLE.USER,
        content: 'How to manage soil moisture?',
        status: MESSAGE_STATUS.COMPLETED,
      };

      const result = (await MessageRepository.create(payload)) as Message & {
        _id: mongoose.Types.ObjectId;
      };

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.conversationId.toString()).toBe(conversationId.toString());
      expect(result.role).toBe(MESSAGE_ROLE.USER);
      expect(result.content).toBe('How to manage soil moisture?');

      const stored = await MessageModel.findById(result._id);
      expect(stored).not.toBeNull();
      expect(stored?.content).toBe('How to manage soil moisture?');
    });
  });

  describe('findByConversationId', () => {
    it('should return messages for a conversation and support limit and sorting options', async () => {
      await MessageModel.create({
        conversationId,
        role: MESSAGE_ROLE.USER,
        content: 'First question',
        status: MESSAGE_STATUS.COMPLETED,
        createdAt: new Date(Date.now() - 5000),
      });

      const msg2 = await MessageModel.create({
        conversationId,
        role: MESSAGE_ROLE.ASSISTANT,
        content: 'First answer',
        status: MESSAGE_STATUS.COMPLETED,
        createdAt: new Date(Date.now() - 2000),
      });

      await MessageModel.create({
        conversationId: anotherConversationId,
        role: MESSAGE_ROLE.USER,
        content: 'Other conversation message',
        status: MESSAGE_STATUS.COMPLETED,
      });

      const allMessages = await MessageRepository.findByConversationId(conversationId);
      expect(allMessages).toHaveLength(2);

      const sortedLimited = (await MessageRepository.findByConversationId(conversationId, {
        limit: 1,
        sort: { createdAt: -1 },
      })) as (Message & { _id: mongoose.Types.ObjectId })[];

      expect(sortedLimited).toHaveLength(1);
      expect(sortedLimited[0]?._id.toString()).toBe(msg2._id.toString());
    });
  });

  describe('findByIdAndConversationId', () => {
    it('should return message when messageId and conversationId match', async () => {
      const created = await MessageModel.create({
        conversationId,
        role: MESSAGE_ROLE.USER,
        content: 'Pest identification',
        status: MESSAGE_STATUS.COMPLETED,
      });

      const result = await MessageRepository.findByIdAndConversationId(created._id, conversationId);

      expect(result).not.toBeNull();
      expect(result?.content).toBe('Pest identification');
    });

    it('should return null when messageId is in another conversation', async () => {
      const created = await MessageModel.create({
        conversationId,
        role: MESSAGE_ROLE.USER,
        content: 'Pest identification',
        status: MESSAGE_STATUS.COMPLETED,
      });

      const result = await MessageRepository.findByIdAndConversationId(
        created._id,
        anotherConversationId
      );

      expect(result).toBeNull();
    });
  });
});
