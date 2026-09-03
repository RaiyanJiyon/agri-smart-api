import type { Types } from 'mongoose';
import type { MESSAGE_ROLE, MESSAGE_STATUS } from './message.constant.js';

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE];

export type MessageStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

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

  status: MessageStatus;
}

export interface SendMessagePayload {
  content: string;
}
