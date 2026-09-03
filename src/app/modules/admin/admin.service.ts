import type { Types } from 'mongoose';
import { type UserStatus, USER_ROLE } from '../auth/index.js';
import type {
  AdminDashboardStatistics,
  AdminUser,
  AdminUserListResult,
  AdminUserQuery,
} from './admin.interface.js';
import { ApiError } from '../../shared/errors/index.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { AdminRepository } from './admin.repository.js';
import { AIUsageService } from '../../shared/ai/index.js';
import { AdminActivityService } from './admin-activity/index.js';
import { ADMIN_ACTIVITY_ACTION } from './admin.constant.js';
import type { AdminAuditContext } from './admin.utils.js';

const getUsers = async (
  query: AdminUserQuery,
  auditContext: AdminAuditContext
): Promise<AdminUserListResult> => {
  const result = await AdminRepository.findUsers(query);

  await AdminActivityService.record({
    adminId: auditContext.adminId,
    action: ADMIN_ACTIVITY_ACTION.VIEW_USERS,
    metadata: {
      search: query.search,
      role: query.role,
      status: query.status,
      page: result.pagination.page,
      limit: result.pagination.limit,
      resultCount: result.users.length,
    },
    ipAddress: auditContext.ipAddress ?? '',
    userAgent: auditContext.userAgent ?? '',
  });

  return result;
};

const getUser = async (
  userId: Types.ObjectId,
  auditContext: AdminAuditContext
): Promise<AdminUser> => {
  const user = await AdminRepository.findUserById(userId);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  await AdminActivityService.record({
    adminId: auditContext.adminId,
    action: ADMIN_ACTIVITY_ACTION.VIEW_USER,
    targetUserId: userId,
    ipAddress: auditContext.ipAddress ?? '',
    userAgent: auditContext.userAgent ?? '',
  });

  return user;
};

const updateUserStatus = async (
  userId: Types.ObjectId,
  status: UserStatus,
  auditContext: AdminAuditContext
): Promise<AdminUser> => {
  const user = await AdminRepository.findUserById(userId);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  if (user.role === USER_ROLE.ADMIN) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Administrator accounts cannot be modified through user management.'
    );
  }

  if (user.status === status) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `User is already ${status}.`);
  }

  const previousStatus = user.status;

  const updatedUser = await AdminRepository.updateUserStatus(userId, status);

  if (!updatedUser) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  const action = AdminActivityService.getStatusChangeAction(previousStatus, status);

  await AdminActivityService.record({
    adminId: auditContext.adminId,
    action,
    targetUserId: userId,
    metadata: {
      previousStatus,
      newStatus: status,
    },
    ipAddress: auditContext.ipAddress,
    userAgent: auditContext.userAgent,
  });

  return updatedUser;
};

const getDashboardStatistics = async (
  auditContext: AdminAuditContext
): Promise<AdminDashboardStatistics> => {
  const statistics = await AdminRepository.getDashboardStatistics();

  await AdminActivityService.record({
    adminId: auditContext.adminId,
    action: ADMIN_ACTIVITY_ACTION.VIEW_DASHBOARD_STATISTICS,
    ipAddress: auditContext.ipAddress ?? '',
    userAgent: auditContext.userAgent ?? '',
  });

  return statistics;
};

const getAIUsageStatistics = async (auditContext: AdminAuditContext) => {
  const statistics = await AIUsageService.getStatistics();

  await AdminActivityService.record({
    adminId: auditContext.adminId,
    action: ADMIN_ACTIVITY_ACTION.VIEW_AI_USAGE_STATISTICS,
    ipAddress: auditContext.ipAddress ?? '',
    userAgent: auditContext.userAgent ?? '',
  });

  return statistics;
};

export const AdminService = {
  getUsers,
  getUser,
  updateUserStatus,
  getDashboardStatistics,
  getAIUsageStatistics,
};
