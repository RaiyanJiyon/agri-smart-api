import type { Types } from 'mongoose';
import type { USER_ROLE, USER_STATUS } from './auth.constant.js';

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export interface User {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isEmailVerified: boolean;
  status: UserStatus;
  profileImage?: string;
  lastLoginAt?: Date;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginPayload {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordPayload {
  userId: Types.ObjectId;

  currentPassword: string;

  newPassword: string;
}
