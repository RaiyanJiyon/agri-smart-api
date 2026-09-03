import { Router } from 'express';
import { auth } from '../../../shared/middleware/auth.js';
import { validateRequest } from '../../../shared/validation/index.js';
import {
  createConversationValidationSchema,
  updateConversationValidationSchema,
} from './ai-assistant.validation.js';
import { ConversationController } from './ai-assistant.controller.js';

const router = Router();

router.post(
  '/',
  auth(),
  validateRequest(createConversationValidationSchema),
  ConversationController.createConversation
);

router.get('/', auth(), ConversationController.getMyConversations);

router.get('/:conversationId', auth(), ConversationController.getMyConversation);

router.patch(
  '/:conversationId',
  auth(),
  validateRequest(updateConversationValidationSchema),
  ConversationController.updateMyConversation
);

router.delete('/:conversationId', auth(), ConversationController.deleteMyConversation);

export const AiAssistantRoutes = router;
