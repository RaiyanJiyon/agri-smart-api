import type { Request, Response } from 'express';
import { getUserObjectId } from '../../../shared/utils/request.utils.js';
import type {
  CreateConversationPayload,
  UpdateConversationPayload,
} from './ai-assistant.interface.js';
import { ConversationService } from './ai-assistant.service.js';
import { sendResponse } from '../../../shared/utils/sendResponse.js';
import { HTTP_STATUS } from '../../../shared/constants/httpStatus.js';
import { catchAsync } from '../../../shared/utils/catchAsync.js';
import { getConversationObjectId } from './ai-assistant.utils.js';

const createConversation = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserObjectId(req);

  const payload = req.body as CreateConversationPayload;

  const conversation = await ConversationService.createConversation(userId, payload);

  sendResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    success: true,
    message: 'Conversation created successfully.',
    data: conversation,
  });
});

const getMyConversations = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserObjectId(req);

  const conversations = await ConversationService.getMyConversations(userId);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Conversations retrieved successfully.',
    data: conversations,
  });
});

const getMyConversation = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserObjectId(req);
  const conversationId = getConversationObjectId(req.params.conversationId as string);

  const conversation = await ConversationService.getMyConversation(conversationId, userId);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Conversation retrieved successfully.',
    data: conversation,
  });
});

const updateMyConversation = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserObjectId(req);
  const conversationId = getConversationObjectId(req.params.conversationId as string);
  const payload = req.body as UpdateConversationPayload;

  const conversation = await ConversationService.updateMyConversation(
    conversationId,
    userId,
    payload
  );

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Conversation updated successfully.',
    data: conversation,
  });
});

const deleteMyConversation = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const userId = getUserObjectId(req);
  const conversationId = getConversationObjectId(req.params.conversationId as string);

  await ConversationService.deleteMyConversation(conversationId, userId);

  sendResponse(res, {
    statusCode: HTTP_STATUS.OK,
    success: true,
    message: 'Conversation deleted successfully.',
    data: null,
  });
});

export const ConversationController = {
  createConversation,
  getMyConversations,
  getMyConversation,
  updateMyConversation,
  deleteMyConversation,
};
