import { Types } from 'mongoose';
import { ApiError } from '../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../shared/constants/index.js';
import type { AdminActivity } from './admin-activity/admin-activity.interface.js';
import type { Request } from 'express';

export type AdminAuditContext = Pick<AdminActivity, 'adminId' | 'ipAddress' | 'userAgent'>;

export const getAdminUserObjectId = (userId: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid user ID.');
  }

  return new Types.ObjectId(userId);
};

export const getAuditContext = (req: Request): AdminAuditContext => {
  if (!req.user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.');
  }

  const auditContext: AdminAuditContext = {
    adminId: getAdminUserObjectId(req.user.userId),
  };

  if (req.ip) {
    auditContext.ipAddress = req.ip;
  }

  const userAgent = req.get('user-agent');

  if (userAgent) {
    auditContext.userAgent = userAgent;
  }

  return auditContext;
};
