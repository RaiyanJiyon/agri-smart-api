export const ADMIN_ACTIVITY_ACTION = {
  VIEW_USER: 'view_user',
  BLOCK_USER: 'block_user',
  UNBLOCK_USER: 'unblock_user',
  DEACTIVATE_USER: 'deactivate_user',
  ACTIVATE_USER: 'activate_user',
  VIEW_STATISTICS: 'view_statistics',
} as const;

export type AdminActivityAction =
  (typeof ADMIN_ACTIVITY_ACTION)[keyof typeof ADMIN_ACTIVITY_ACTION];
