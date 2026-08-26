import mongoose from 'mongoose';
import type { AdminActivity } from '../../src/app/modules/admin/admin-activity/admin-activity.interface.js';
import { ADMIN_ACTIVITY_ACTION } from '../../src/app/modules/admin/admin.constant.js';

export interface MockAdminActivity extends AdminActivity {
  _id: mongoose.Types.ObjectId;
}

export const createMockAdminActivity = (
  overrides: Partial<MockAdminActivity> = {}
): MockAdminActivity => {
  const activityId = overrides._id ?? new mongoose.Types.ObjectId();
  const adminId = overrides.adminId ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();

  const base: MockAdminActivity = {
    _id: activityId,
    adminId,
    action: ADMIN_ACTIVITY_ACTION.VIEW_USERS,
    metadata: {},
    ipAddress: '127.0.0.1',
    userAgent: 'vitest-test-agent',
    createdAt: defaultDate,
    ...overrides,
  };

  return base;
};

export const createMockAdminActivityList = (
  count = 3,
  overrides: Partial<MockAdminActivity> = {}
): MockAdminActivity[] => {
  return Array.from({ length: count }, () => createMockAdminActivity({ ...overrides }));
};
