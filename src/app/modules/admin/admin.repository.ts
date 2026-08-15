import type { Types } from 'mongoose';
import type {
  AdminDashboardStatistics,
  AdminUser,
  AdminUserListResult,
  AdminUserQuery,
} from './admin.interface.js';
import { AuthModel } from '../auth/auth.model.js';
import type { UserStatus } from '../auth/auth.interface.js';
import { USER_STATUS } from '../auth/auth.constant.js';
import { CropRecommendationModel } from '../crop-recommendations/crop-recommendation.model.js';
import { DiseaseReportModel } from '../disease-detection/disease-detection.model.js';
import { AIUsageModel } from '../../shared/ai/ai-usage.model.js';

const findUsers = async (query: AdminUserQuery): Promise<AdminUserListResult> => {
  const { search, role, status, page = 1, limit = 20 } = query;

  const filter: Record<string, unknown> = {};

  if (search) {
    // Escape all special regex characters so they are treated as literal text
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    filter.$or = [
      {
        name: {
          $regex: escapedSearch,
          $options: 'i',
        },
      },
      {
        email: {
          $regex: escapedSearch,
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
      returnDocument: 'after',
    }
  )
    .select(
      '_id name email role isEmailVerified status profileImage lastLoginAt createdAt updatedAt'
    )
    .lean<AdminUser | null>();
};

const getDashboardStatistics = async (): Promise<AdminDashboardStatistics> => {
  const [totalUsers, activeUsers, totalCropRecommendations, totalDiseaseAnalyses, totalAiRequests] =
    await Promise.all([
      AuthModel.countDocuments(),

      AuthModel.countDocuments({
        status: USER_STATUS.ACTIVE,
      }),

      CropRecommendationModel.countDocuments(),

      DiseaseReportModel.countDocuments(),

      AIUsageModel.countDocuments(),
    ]);

  return {
    totalUsers,
    activeUsers,
    totalCropRecommendations,
    totalDiseaseAnalyses,
    totalAiRequests,
  };
};

export const AdminRepository = {
  findUsers,
  findUserById,
  updateUserStatus,
  getDashboardStatistics,
};
