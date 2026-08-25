import mongoose from 'mongoose';
import type { Conversation } from '../../src/app/modules/ai-assistant/conversation/ai-assistant.interface.js';
import type { Message } from '../../src/app/modules/ai-assistant/message/message.interface.js';
import { CONVERSATION_STATUS } from '../../src/app/modules/ai-assistant/conversation/ai-assistant.constant.js';
import { MESSAGE_ROLE, MESSAGE_STATUS } from '../../src/app/modules/ai-assistant/message/message.constant.js';

export interface MockConversation extends Conversation {
  _id: mongoose.Types.ObjectId;
}

export interface MockMessage extends Message {
  _id: mongoose.Types.ObjectId;
}

export const createMockConversation = (
  overrides: Partial<MockConversation> = {}
): MockConversation => {
  const conversationId = overrides._id ?? new mongoose.Types.ObjectId();
  const userId = overrides.userId ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();

  const base: MockConversation = {
    _id: conversationId,
    userId,
    title: 'Soil pH Consultation',
    status: CONVERSATION_STATUS.ACTIVE,
    lastActivityAt: defaultDate,
    createdAt: defaultDate,
    updatedAt: defaultDate,
    ...overrides,
  };

  return base;
};

export const createMockConversationList = (
  count = 2,
  overrides: Partial<MockConversation> = {}
): MockConversation[] => {
  return Array.from({ length: count }, () =>
    createMockConversation({
      ...overrides,
    })
  );
};

export const createMockMessage = (overrides: Partial<MockMessage> = {}): MockMessage => {
  const messageId = overrides._id ?? new mongoose.Types.ObjectId();
  const conversationId = overrides.conversationId ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();

  return {
    _id: messageId,
    conversationId,
    role: MESSAGE_ROLE.USER,
    content: 'How can I treat late blight on tomato plants?',
    status: MESSAGE_STATUS.COMPLETED,
    createdAt: defaultDate,
    updatedAt: defaultDate,
    ...overrides,
  };
};

export const createMockMessageList = (
  count = 2,
  overrides: Partial<MockMessage> = {}
): MockMessage[] => {
  return Array.from({ length: count }, () =>
    createMockMessage({
      ...overrides,
    })
  );
};
