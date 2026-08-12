import type { Types } from 'mongoose';
import type { UserRole, UserStatus } from '../auth/auth.interface.js';

export interface AdminUser {
  _id: Types.ObjectId;

  name: string;

  email: string;

  role: UserRole;

  isEmailVerified: boolean;

  status: UserStatus;

  profileImage?: string;

  lastLoginAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

export interface AdminUserQuery {
  search?: string;

  role?: UserRole;

  status?: UserStatus;

  page?: number;

  limit?: number;
}

export interface AdminUserListResult {
  users: AdminUser[];

  pagination: {
    page: number;

    limit: number;

    total: number;

    totalPages: number;
  };
}

export interface AdminDashboardStatistics {
  totalUsers: number;

  activeUsers: number;

  totalAiRequests: number;

  totalDiseaseAnalyses: number;

  totalCropRecommendations: number;
}
