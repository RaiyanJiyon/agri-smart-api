import type { Types } from 'mongoose';
import type { AdminActivityAction } from '../admin.constant.js';

export interface AdminActivity {
  adminId: Types.ObjectId;

  action: AdminActivityAction;

  targetUserId?: Types.ObjectId;

  metadata?: Record<string, unknown>;

  ipAddress?: string;

  userAgent?: string;

  createdAt?: Date;
}

export interface AdminActivityQuery {
  adminId?: Types.ObjectId;
  targetUserId?: Types.ObjectId;
  action?: AdminActivityAction;
  page?: number;
  limit?: number;
}

export interface AdminActivityListResult {
  activities: AdminActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
