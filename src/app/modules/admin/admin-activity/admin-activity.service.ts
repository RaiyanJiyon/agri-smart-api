import type { Types } from 'mongoose';
import type { AdminActivity } from './admin-activity.interface.js';
import { AdminActivityRepository } from './admin-activity.repository.js';

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

export const AdminActivityService = {
  record,
  getRecent,
  getByAdminId,
  getByTargetUserId,
};
