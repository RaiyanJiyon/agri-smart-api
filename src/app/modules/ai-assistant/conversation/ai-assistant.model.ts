import { model, Schema } from 'mongoose';
import type { Conversation } from './ai-assistant.interface.js';
import { COLLECTION_NAME } from '../../../shared/constants/index.js';
import { CONVERSATION_STATUS } from './ai-assistant.constant.js';

const conversationSchema = new Schema<Conversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      required: true,
      index: true,
    },

    profileId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.PROFILE,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 200,
    },

    status: {
      type: String,
      enum: Object.values(CONVERSATION_STATUS),
      required: true,
      default: CONVERSATION_STATUS.ACTIVE,
      index: true,
    },

    lastActivityAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ConversationModel = model<Conversation>(
  COLLECTION_NAME.CONVERSATION,
  conversationSchema
);
