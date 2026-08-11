import type { Types } from 'mongoose';
import type { ConversationStatus } from './ai-assistant.constant.js';

export interface Conversation {
  userId: Types.ObjectId;

  profileId?: Types.ObjectId;

  title: string;

  status: ConversationStatus;

  lastActivityAt: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export interface CreateConversationPayload {
  profileId?: Types.ObjectId;

  title: string;
}

export interface UpdateConversationPayload {
  title?: string;

  status?: ConversationStatus;
}
