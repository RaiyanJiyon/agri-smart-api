import type { Types } from 'mongoose';
import type { AdminActivityAction } from '../admin.constant.js';
import type { UserRole, UserStatus } from '../../auth/auth.interface.js';

export interface AdminActivity {
  adminId: Types.ObjectId;

  action: AdminActivityAction;

  targetUserId?: Types.ObjectId;

  metadata?: Record<string, unknown>;

  ipAddress?: string | undefined;

  userAgent?: string | undefined;

  createdAt?: Date;
}

export interface AdminActivityQuery {
  adminId?: Types.ObjectId;
  targetUserId?: Types.ObjectId;
  action?: AdminActivityAction;
  page?: number;
  limit?: number;
}

export interface AdminActivityPopulatedUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
}

export interface AdminActivityPopulated extends Omit<AdminActivity, 'adminId' | 'targetUserId'> {
  adminId: AdminActivityPopulatedUser;
  targetUserId?: AdminActivityPopulatedUser;
}

export interface AdminActivityListResult {
  activities: AdminActivityPopulated[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
