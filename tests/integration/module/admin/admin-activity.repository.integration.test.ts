import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AdminActivityRepository } from '../../../../src/app/modules/admin/admin-activity/admin-activity.repository.js';
import { AdminActivityModel } from '../../../../src/app/modules/admin/admin-activity/admin-activity.model.js';
import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { ADMIN_ACTIVITY_ACTION } from '../../../../src/app/modules/admin/admin.constant.js';
import { USER_ROLE, USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';
import type { AdminActivity } from '../../../../src/app/modules/admin/admin-activity/admin-activity.interface.js';

describe('AdminActivityRepository integration', () => {
  let adminId: mongoose.Types.ObjectId;
  let targetUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const hashedPassword = await hashPassword('Password123!');

    const admin = await AuthModel.create({
      name: 'System Admin',
      email: 'sysadmin@example.com',
      password: hashedPassword,
      role: USER_ROLE.ADMIN,
      status: USER_STATUS.ACTIVE,
      isEmailVerified: true,
    });

    const targetUser = await AuthModel.create({
      name: 'Target Farmer',
      email: 'targetfarmer@example.com',
      password: hashedPassword,
      role: USER_ROLE.FARMER,
      status: USER_STATUS.ACTIVE,
      isEmailVerified: true,
    });

    adminId = admin._id;
    targetUserId = targetUser._id;
  });

  describe('create and findById', () => {
    it('should create an activity document and retrieve it with populated fields', async () => {
      const payload: AdminActivity = {
        adminId,
        targetUserId,
        action: ADMIN_ACTIVITY_ACTION.BLOCK_USER,
        metadata: { reason: 'Policy violation' },
        ipAddress: '127.0.0.1',
        userAgent: 'integration-test',
      };

      const created = await AdminActivityRepository.create(payload);
      expect(created._id).toBeDefined();

      const populated = await AdminActivityRepository.findById(created._id as mongoose.Types.ObjectId);

      expect(populated).not.toBeNull();
      expect(populated?.adminId).toBeDefined();
      expect((populated?.adminId as unknown as { email: string }).email).toBe(
        'sysadmin@example.com'
      );
      expect((populated?.targetUserId as unknown as { email: string }).email).toBe(
        'targetfarmer@example.com'
      );
    });
  });

  describe('find Recent, byAdminId, byTargetUserId, and paginated find', () => {
    it('should filter and paginate activity records accurately', async () => {
      await AdminActivityModel.create([
        {
          adminId,
          targetUserId,
          action: ADMIN_ACTIVITY_ACTION.VIEW_USERS,
          ipAddress: '127.0.0.1',
          userAgent: 'test',
        },
        {
          adminId,
          targetUserId,
          action: ADMIN_ACTIVITY_ACTION.BLOCK_USER,
          ipAddress: '127.0.0.1',
          userAgent: 'test',
        },
      ]);

      const recent = await AdminActivityRepository.findRecent(1);
      expect(recent).toHaveLength(1);

      const byAdmin = await AdminActivityRepository.findByAdminId(adminId);
      expect(byAdmin).toHaveLength(2);

      const byTarget = await AdminActivityRepository.findByTargetUserId(targetUserId);
      expect(byTarget).toHaveLength(2);

      const paginated = await AdminActivityRepository.find({
        adminId,
        action: ADMIN_ACTIVITY_ACTION.BLOCK_USER,
        page: 1,
        limit: 10,
      });

      expect(paginated.activities).toHaveLength(1);
      expect(paginated.pagination.total).toBe(1);
    });
  });
});
