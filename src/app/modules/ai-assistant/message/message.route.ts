import { Router } from 'express';
import { auth } from '../../../shared/middleware/auth.js';
import validateRequest from '../../../shared/validation/validateRequest.js';
import {
  conversationMessagesValidationSchema,
  sendMessageValidationSchema,
} from './message.validation.js';
import { MessageController } from './message.controller.js';

const router = Router();

router.post(
  '/:conversationId/messages',
  auth(),
  validateRequest(sendMessageValidationSchema),
  MessageController.sendMessage
);

router.get(
  '/:conversationId/messages',
  auth(),
  validateRequest(conversationMessagesValidationSchema),
  MessageController.getConversationMessages
);

export const MessageRoute = router;
