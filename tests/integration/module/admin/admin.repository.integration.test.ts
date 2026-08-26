import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AdminRepository } from '../../../../src/app/modules/admin/admin.repository.js';
import { AuthModel } from '../../../../src/app/modules/auth/auth.model.js';
import { USER_ROLE, USER_STATUS } from '../../../../src/app/modules/auth/auth.constant.js';
import { hashPassword } from '../../../../src/app/shared/utils/argon.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';

describe('AdminRepository integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('findUsers', () => {
    it('should search users by name or email with role/status filters and pagination', async () => {
      const hashedPassword = await hashPassword('Password123!');

      await AuthModel.create([
        {
          name: 'Alice Farmer',
          email: 'alice@example.com',
          password: hashedPassword,
          role: USER_ROLE.FARMER,
          status: USER_STATUS.ACTIVE,
          isEmailVerified: true,
        },
        {
          name: 'Bob Farmer',
          email: 'bob@example.com',
          password: hashedPassword,
          role: USER_ROLE.FARMER,
          status: USER_STATUS.BLOCKED,
          isEmailVerified: true,
        },
        {
          name: 'Charlie Admin',
          email: 'charlie@example.com',
          password: hashedPassword,
          role: USER_ROLE.ADMIN,
          status: USER_STATUS.ACTIVE,
          isEmailVerified: true,
        },
      ]);

      const searchResult = await AdminRepository.findUsers({ search: 'Alice' });
      expect(searchResult.users).toHaveLength(1);
      expect(searchResult.users[0]?.email).toBe('alice@example.com');

      const roleResult = await AdminRepository.findUsers({ role: USER_ROLE.FARMER });
      expect(roleResult.users).toHaveLength(2);

      const statusResult = await AdminRepository.findUsers({ status: USER_STATUS.BLOCKED });
      expect(statusResult.users).toHaveLength(1);
      expect(statusResult.users[0]?.name).toBe('Bob Farmer');
    });
  });

  describe('findUserById and updateUserStatus', () => {
    it('should find user by ID and update status', async () => {
      const hashedPassword = await hashPassword('Password123!');

      const user = await AuthModel.create({
        name: 'David Farmer',
        email: 'david@example.com',
        password: hashedPassword,
        role: USER_ROLE.FARMER,
        status: USER_STATUS.ACTIVE,
        isEmailVerified: true,
      });

      const found = await AdminRepository.findUserById(user._id);
      expect(found).not.toBeNull();
      expect(found?.email).toBe('david@example.com');

      const updated = await AdminRepository.updateUserStatus(user._id, USER_STATUS.BLOCKED);
      expect(updated?.status).toBe(USER_STATUS.BLOCKED);

      const verify = await AuthModel.findById(user._id);
      expect(verify?.status).toBe(USER_STATUS.BLOCKED);
    });
  });

  describe('getDashboardStatistics', () => {
    it('should aggregate system-wide counts', async () => {
      const hashedPassword = await hashPassword('Password123!');

      await AuthModel.create([
        {
          name: 'User 1',
          email: 'u1@example.com',
          password: hashedPassword,
          role: USER_ROLE.FARMER,
          status: USER_STATUS.ACTIVE,
          isEmailVerified: true,
        },
        {
          name: 'User 2',
          email: 'u2@example.com',
          password: hashedPassword,
          role: USER_ROLE.FARMER,
          status: USER_STATUS.INACTIVE,
          isEmailVerified: true,
        },
      ]);

      const stats = await AdminRepository.getDashboardStatistics();

      expect(stats.totalUsers).toBe(2);
      expect(stats.activeUsers).toBe(1);
      expect(stats.totalCropRecommendations).toBe(0);
      expect(stats.totalDiseaseAnalyses).toBe(0);
      expect(stats.totalAiRequests).toBe(0);
    });
  });
});
