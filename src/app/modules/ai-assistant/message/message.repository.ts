import type { Types } from 'mongoose';
import type { CreateMessagePayload, Message } from './message.interface.js';
import { MessageModel } from './message.model.js';

const create = async (payload: CreateMessagePayload): Promise<Message> => {
  const message = await MessageModel.create(payload);

  return message.toObject();
};

const findByConversationId = async (conversationId: Types.ObjectId): Promise<Message[]> => {
  return MessageModel.find({
    conversationId,
  })
    .sort({ createdAt: -1 })
    .lean<Message[]>();
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
