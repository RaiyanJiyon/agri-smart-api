export const AI_OPERATION = {
  CROP_RECOMMENDATION: 'crop_recommendation',
  DISEASE_DETECTION: 'disease_detection',
  CHAT: 'chat',
} as const;

export type AiOperation = (typeof AI_OPERATION)[keyof typeof AI_OPERATION];

export const AI_EXECUTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export type AiExecutionStatus = (typeof AI_EXECUTION_STATUS)[keyof typeof AI_EXECUTION_STATUS];
