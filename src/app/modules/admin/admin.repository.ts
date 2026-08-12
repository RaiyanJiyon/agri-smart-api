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

const getDashboardStatistics = async (): Promise<AdminDashboardStatistics> => {
  const [totalUsers, activeUsers, totalCropRecommendations, totalDiseaseAnalyses] =
    await Promise.all([
      AuthModel.countDocuments(),

      AuthModel.countDocuments({
        status: USER_STATUS.ACTIVE,
      }),

      CropRecommendationModel.countDocuments(),

      DiseaseReportModel.countDocuments(),
    ]);

  /**
   * !fake/approximate AI statistics for the chat assistant just to make the dashboard look more complete.
   *
   * * For the AI chat, we'll eventually need proper usage telemetry if we want metrics such as:
   *
   * * total chat requests
   * * successful/failed requests
   * * model used
   * * token usage
   * * latency
   * * errors
   * We will work on this later, but for now, we will just use the total of crop recommendations and disease analyses as a rough estimate of AI usage.
   */

  const totalAiRequests = totalCropRecommendations + totalDiseaseAnalyses;

  return {
    totalUsers,
    activeUsers,
    totalAiRequests,
    totalDiseaseAnalyses,
    totalCropRecommendations,
  };
};

export const AdminRepository = {
  findUsers,
  findUserById,
  updateUserStatus,
  getDashboardStatistics,
};
