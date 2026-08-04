import type { Types } from 'mongoose';
import type { VERIFICATION_TYPE } from './verification.constant.js';
import type { IUser } from '../auth/auth.interface.js';

export type VerificationType = (typeof VERIFICATION_TYPE)[keyof typeof VERIFICATION_TYPE];

export interface IVerification {
  userId: Types.ObjectId;
  type: VerificationType;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date;
}

export interface ICreateVerification {
  userId: Types.ObjectId;
  type: VerificationType;
  tokenHash: string;
  expiresAt: Date;
}

export interface ISendVerificationEmailOptions {
  email: string;
  type: VerificationType;
  expiresIn: string;
  subject: string;
  buildUrl: (token: string) => string;
  buildTemplate: (url: string, user: IUser) => string;
  requireUnverifiedEmail?: boolean;
}