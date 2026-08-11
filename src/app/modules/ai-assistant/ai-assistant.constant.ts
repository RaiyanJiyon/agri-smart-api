export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export type ConversationStatus = (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];