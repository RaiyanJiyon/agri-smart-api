import type { Types } from 'mongoose';
import type { AdminActivity } from './admin-activity.interface.js';
import { AdminActivityModel } from './admin-activity.model.js';

const create = async (payload: AdminActivity): Promise<AdminActivity> => {
  const activity = await AdminActivityModel.create(payload);

  return activity.toObject();
};

const findRecent = async (limit: number): Promise<AdminActivity[]> => {
  return AdminActivityModel.find({}).sort({ createdAt: -1 }).limit(limit).lean<AdminActivity[]>();
};

const findByAdminId = async (adminId: Types.ObjectId): Promise<AdminActivity[]> => {
  return AdminActivityModel.find({
    adminId,
  })
    .sort({ createdAt: -1 })
    .lean<AdminActivity[]>();
};

const findByTargetUserId = async (targetUserId: Types.ObjectId): Promise<AdminActivity[]> => {
  return AdminActivityModel.find({
    targetUserId,
  })
    .sort({ createdAt: -1 })
    .lean<AdminActivity[]>();
};

export const AdminActivityRepository = {
  create,
  findRecent,
  findByAdminId,
  findByTargetUserId,
};
