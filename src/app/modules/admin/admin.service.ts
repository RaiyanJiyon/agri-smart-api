import type { Types } from 'mongoose';
import type { UserStatus } from '../auth/auth.interface.js';
import type {
  AdminDashboardStatistics,
  AdminUser,
  AdminUserListResult,
  AdminUserQuery,
} from './admin.interface.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import { AdminRepository } from './admin.repository.js';
import { USER_ROLE } from '../auth/auth.constant.js';

const getUsers = async (query: AdminUserQuery): Promise<AdminUserListResult> => {
  return AdminRepository.findUsers(query);
};

const getUser = async (userId: Types.ObjectId): Promise<AdminUser> => {
  const user = await AdminRepository.findUserById(userId);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  return user;
};

const updateUserStatus = async (userId: Types.ObjectId, status: UserStatus): Promise<AdminUser> => {
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

  const updatedUser = await AdminRepository.updateUserStatus(userId, status);

  if (!updatedUser) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  return updatedUser;
};

const getDashboardStatistics = async (): Promise<AdminDashboardStatistics> => {
  return AdminRepository.getDashboardStatistics();
};

export const AdminService = {
  getUsers,
  getUser,
  updateUserStatus,
  getDashboardStatistics,
};
