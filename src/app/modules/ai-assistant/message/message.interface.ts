import type { Types } from 'mongoose';
import type { MessageRole, MessageStatus } from './message.constant.js';

export interface Message {
  conversationId: Types.ObjectId;

  role: MessageRole;

  content: string;

  status: MessageStatus;

  createdAt?: Date;

  updatedAt?: Date;
}

export interface CreateMessagePayload {
  conversationId: Types.ObjectId;

  role: MessageRole;

  content: string;
}

export interface SendMessagePayload {
  content: string;
}
