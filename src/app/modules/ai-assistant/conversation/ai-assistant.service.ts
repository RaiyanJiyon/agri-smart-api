import type { Types } from 'mongoose';
import type {
  Conversation,
  CreateConversationPayload,
  UpdateConversationPayload,
} from './ai-assistant.interface.js';
import { ProfileRepository } from '../../profile/index.js';
import { ApiError } from '../../../shared/errors/index.js';
import { HTTP_STATUS } from '../../../shared/constants/index.js';
import { ConversationRepository } from './ai-assistant.repository.js';

const createConversation = async (
  userId: Types.ObjectId,
  payload: CreateConversationPayload
): Promise<Conversation> => {
  if (payload.profileId) {
    const profile = await ProfileRepository.findByUserId(userId);

    if (!profile) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Profile not found.');
    }

    const profileId = (profile as unknown as { _id: Types.ObjectId })._id;

    if (profileId.toString() !== payload.profileId.toString()) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to use this profile.');
    }
  }

  return ConversationRepository.create(userId, payload);
};

const getMyConversations = async (userId: Types.ObjectId): Promise<Conversation[]> => {
  return ConversationRepository.findByUserId(userId);
};

const getMyConversation = async (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<Conversation | null> => {
  const conversation = await ConversationRepository.findByIdAndUserId(conversationId, userId);

  if (!conversation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Conversation not found.');
  }

  return conversation;
};

const updateMyConversation = async (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId,
  payload: UpdateConversationPayload
): Promise<Conversation | null> => {
  const conversation = await ConversationRepository.updateByIdAndUserId(
    conversationId,
    userId,
    payload
  );

  if (!conversation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Conversation not found.');
  }

  return conversation;
};

const deleteMyConversation = async (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<void> => {
  const conversation = await ConversationRepository.softDeleteByIdAndUserId(conversationId, userId);

  if (!conversation) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Conversation not found.');
  }
};

export const ConversationService = {
  createConversation,
  getMyConversations,
  getMyConversation,
  updateMyConversation,
  deleteMyConversation,
};
