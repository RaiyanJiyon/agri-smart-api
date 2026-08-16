import type { Types } from 'mongoose';
import type { CreateMessagePayload, Message } from './message.interface.js';
import { MessageModel } from './message.model.js';

const create = async (payload: CreateMessagePayload): Promise<Message> => {
  const message = await MessageModel.create(payload);

  return message.toObject();
};

const findByConversationId = async (
  conversationId: Types.ObjectId,
  options?: { limit?: number; sort?: Record<string, 1 | -1> }
): Promise<Message[]> => {
  const query = MessageModel.find({ conversationId });

  if (options?.limit) {
    query.limit(options.limit);
  }

  if (options?.sort) {
    query.sort(options.sort);
  }

  return query.lean<Message[]>();
};

const findByIdAndConversationId = async (
  messageId: Types.ObjectId,
  conversationId: Types.ObjectId
): Promise<Message | null> => {
  return MessageModel.findOne({
    _id: messageId,
    conversationId,
  }).lean<Message | null>();
};

export const MessageRepository = {
  create,
  findByConversationId,
  findByIdAndConversationId,
};
