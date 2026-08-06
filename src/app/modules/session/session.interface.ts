import type { Types } from 'mongoose';

export interface Session {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  lastUsedAt?: Date | null;
  device?: string;
}

export interface CreateSession {
  userId: Types.ObjectId;
  refreshToken: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  expiresAt: Date;
}
