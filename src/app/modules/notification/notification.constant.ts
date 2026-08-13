export const NOTIFICATION_TYPE = {
  SYSTEM: 'system',
  ACCOUNT: 'account',
  AI: 'ai',
  DISEASE_DETECTION: 'disease_detection',
  CROP_RECOMMENDATION: 'crop_recommendation',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
} as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];
