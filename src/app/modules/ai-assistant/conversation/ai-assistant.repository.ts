import type { Types } from 'mongoose';
import type {
  Conversation,
  CreateConversationPayload,
  UpdateConversationPayload,
} from './ai-assistant.interface.js';
import { ConversationModel } from './ai-assistant.model.js';

const create = async (
  userId: Types.ObjectId,
  payload: CreateConversationPayload
): Promise<Conversation> => {
  const conversation = await ConversationModel.create({
    userId,
    ...payload,
    lastActivityAt: new Date(),
  });

  return conversation.toObject();
};

const findByUserId = async (userId: Types.ObjectId): Promise<Conversation[]> => {
  return ConversationModel.find({
    userId,
  })
    .sort({ lastActivityAt: -1 })
    .lean<Conversation[]>();
};

const findByIdAndUserId = async (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Conversation | null> => {
  return ConversationModel.findOne({
    _id: conversationId,
    userId,
  }).lean<Conversation | null>();
};

const updateByIdAndUserId = async (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId,
  payload: UpdateConversationPayload
): Promise<Conversation | null> => {
  return ConversationModel.findOneAndUpdate(
    {
      _id: conversationId,
      userId,
    },
    {
      $set: {
        ...payload,
        ...(payload.status === undefined
          ? {}
          : {
              lastActivityAt: new Date(),
            }),
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  ).lean<Conversation | null>();
};

const softDeleteByIdAndUserId = async (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Conversation | null> => {
  return ConversationModel.findOneAndUpdate(
    {
      _id: conversationId,
      userId,
    },
    {
      $set: {
        status: 'completed',
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  ).lean<Conversation | null>();
};

export const ConversationRepository = {
  create,
  findByUserId,
  findByIdAndUserId,
  updateByIdAndUserId,
  softDeleteByIdAndUserId,
};
