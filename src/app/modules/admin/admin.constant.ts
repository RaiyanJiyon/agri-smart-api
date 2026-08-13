export const ADMIN_ACTIVITY_ACTION = {
  VIEW_USER: 'view_user',
  VIEW_USERS: 'view_users',
  BLOCK_USER: 'block_user',
  UNBLOCK_USER: 'unblock_user',
  DEACTIVATE_USER: 'deactivate_user',
  ACTIVATE_USER: 'activate_user',
  VIEW_DASHBOARD_STATISTICS: 'view_dashboard_statistics',
  VIEW_AI_USAGE_STATISTICS: 'view_ai_usage_statistics',
} as const;

export type AdminActivityAction =
  (typeof ADMIN_ACTIVITY_ACTION)[keyof typeof ADMIN_ACTIVITY_ACTION];
