import type { Types } from 'mongoose';
import type {
  AdminActivity,
  AdminActivityListResult,
  AdminActivityQuery,
} from './admin-activity.interface.js';
import { AdminActivityRepository } from './admin-activity.repository.js';
import { ApiError } from '../../../shared/errors/ApiError.js';
import { HTTP_STATUS } from '../../../shared/constants/httpStatus.js';

const record = async (payload: AdminActivity): Promise<AdminActivity> => {
  return AdminActivityRepository.create(payload);
};

const getRecent = async (limit: number): Promise<AdminActivity[]> => {
  return AdminActivityRepository.findRecent(limit);
};

const getByAdminId = async (adminId: Types.ObjectId): Promise<AdminActivity[]> => {
  return AdminActivityRepository.findByAdminId(adminId);
};

const getByTargetUserId = async (targetUserId: Types.ObjectId): Promise<AdminActivity[]> => {
  return AdminActivityRepository.findByTargetUserId(targetUserId);
};

const get = async (query: AdminActivityQuery): Promise<AdminActivityListResult> => {
  return AdminActivityRepository.find(query);
};

const getById = async (activityId: Types.ObjectId): Promise<AdminActivity> => {
  const activity = await AdminActivityRepository.findById(activityId);

  if (!activity) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin activity not found.');
  }

  return activity;
};

export const AdminActivityService = {
  record,
  getRecent,
  getByAdminId,
  getByTargetUserId,
  get,
  getById,
};
