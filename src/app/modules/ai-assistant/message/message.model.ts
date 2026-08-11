import { model, Schema } from 'mongoose';
import type { Message } from './message.interface.js';
import { COLLECTION_NAME } from '../../../shared/constants/database.js';
import { MESSAGE_ROLE, MESSAGE_STATUS } from './message.constant.js';

const messageSchema = new Schema<Message>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.CONVERSATION,
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: Object.values(MESSAGE_ROLE),
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(MESSAGE_STATUS),
      required: true,
      default: MESSAGE_STATUS.COMPLETED,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Optimize conversation history queries.
messageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

export const MessageModel = model<Message>(COLLECTION_NAME.MESSAGE, messageSchema);
