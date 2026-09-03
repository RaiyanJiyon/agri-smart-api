import type { Types } from 'mongoose';
import type {
  AdminActivity,
  AdminActivityListResult,
  AdminActivityPopulated,
  AdminActivityQuery,
} from './admin-activity.interface.js';
import { AdminActivityRepository } from './admin-activity.repository.js';
import { ApiError } from '../../../shared/errors/index.js';
import { HTTP_STATUS } from '../../../shared/constants/index.js';
import { type UserStatus, USER_STATUS } from '../../auth/index.js';
import { ADMIN_ACTIVITY_ACTION, type AdminActivityAction } from '../admin.constant.js';

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

const getById = async (activityId: Types.ObjectId): Promise<AdminActivityPopulated> => {
  const activity = await AdminActivityRepository.findById(activityId);

  if (!activity) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin activity not found.');
  }

  return activity;
};

const getStatusChangeAction = (
  previousStatus: UserStatus,
  newStatus: UserStatus
): AdminActivityAction => {
  if (previousStatus === USER_STATUS.INACTIVE && newStatus === USER_STATUS.ACTIVE) {
    return ADMIN_ACTIVITY_ACTION.ACTIVATE_USER;
  }

  if (previousStatus === USER_STATUS.BLOCKED && newStatus === USER_STATUS.ACTIVE) {
    return ADMIN_ACTIVITY_ACTION.UNBLOCK_USER;
  }

  if (newStatus === USER_STATUS.INACTIVE) {
    return ADMIN_ACTIVITY_ACTION.DEACTIVATE_USER;
  }

  if (newStatus === USER_STATUS.BLOCKED) {
    return ADMIN_ACTIVITY_ACTION.BLOCK_USER;
  }

  return ADMIN_ACTIVITY_ACTION.UPDATE_USER_STATUS;
};

export const AdminActivityService = {
  record,
  getRecent,
  getByAdminId,
  getByTargetUserId,
  get,
  getById,
  getStatusChangeAction,
};
