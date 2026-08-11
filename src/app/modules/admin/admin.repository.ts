import type { Types } from 'mongoose';
import type { AdminUser, AdminUserListResult, AdminUserQuery } from './admin.interface.js';
import { AuthModel } from '../auth/auth.model.js';
import type { UserStatus } from '../auth/auth.interface.js';

const findUsers = async (query: AdminUserQuery): Promise<AdminUserListResult> => {
  const { search, role, status, page = 1, limit = 20 } = query;

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: 'i',
        },
      },
      {
        email: {
          $regex: search,
          $options: 'i',
        },
      },
    ];
  }

  if (role) {
    filter.role = role;
  }

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    AuthModel.find(filter)
      .select(
        '_id name email role isEmailVerified status profileImage lastLoginAt createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<AdminUser[]>(),

    AuthModel.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const findUserById = async (userId: Types.ObjectId): Promise<AdminUser | null> => {
  return AuthModel.findById(userId)
    .select(
      '_id name email role isEmailVerified status profileImage lastLoginAt createdAt updatedAt'
    )
    .lean<AdminUser | null>();
};

const updateUserStatus = async (
  userId: Types.ObjectId,
  status: UserStatus
): Promise<AdminUser | null> => {
  return AuthModel.findByIdAndUpdate(
    userId,
    {
      status,
    },
    {
      new: true,
    }
  )
    .select(
      '_id name email role isEmailVerified status profileImage lastLoginAt createdAt updatedAt'
    )
    .lean<AdminUser | null>();
};

export const AdminRepository = {
  findUsers,
  findUserById,
  updateUserStatus,
};
