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
  limit?: number;
}
