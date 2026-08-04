import type { Types } from 'mongoose';
import type { SESSION_STATUS } from './session.constant.js';

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

export interface ISession {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  lastUsedAt?: Date | null;
  device?: string;
}

export interface ICreateSession {
  userId: Types.ObjectId;
  refreshToken: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  expiresAt: Date;
}
