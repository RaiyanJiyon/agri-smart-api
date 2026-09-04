import type { Request, Response } from 'express';
import { catchAsync } from '../../../shared/utils/catchAsync.js';
import { getUserObjectId } from '../../../shared/utils/user.utils.js';
import { getConversationObjectId } from '../conversation/ai-assistant.utils.js';
import { MessageService } from './message.service.js';
import { sendResponse } from '../../../shared/utils/sendResponse.js';
import { HTTP_STATUS } from '../../../shared/constants/httpStatus.js';
import type { SendMessagePayload } from './message.interface.js';

const sendMessage = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserObjectId(req);

  const conversationId = getConversationObjectId(req.params.conversationId as string);

  const payload = req.body as SendMessagePayload;

  const result = await MessageService.sendMessage(userId, conversationId, payload);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Message sent successfully.',
    data: result,
  });
});

const getConversationMessages = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserObjectId(req);

  const conversationId = getConversationObjectId(req.params.conversationId as string);

  const messages = await MessageService.getConversationMessages(userId, conversationId);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Conversation messages retrieved successfully.',
    data: messages,
  });
});

export const MessageController = {
  sendMessage,
  getConversationMessages,
};
