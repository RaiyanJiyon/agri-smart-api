import type { Types } from 'mongoose';
import type {
  AdminActivity,
  AdminActivityListResult,
  AdminActivityQuery,
} from './admin-activity.interface.js';
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

const find = async (query: AdminActivityQuery): Promise<AdminActivityListResult> => {
  const { adminId, targetUserId, action, page = 1, limit = 50 } = query;

  const filter: Record<string, unknown> = {};

  if (adminId) {
    filter.adminId = adminId;
  }

  if (targetUserId) {
    filter.targetUserId = targetUserId;
  }

  if (action) {
    filter.action = action;
  }

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    AdminActivityModel.find(filter)
      .populate({
        path: 'adminId',
        select: '_id name email role',
      })
      .populate({
        path: 'targetUserId',
        select: '_id name email role status',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<AdminActivity[]>(),

    AdminActivityModel.countDocuments(filter),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const findById = async (activityId: Types.ObjectId): Promise<AdminActivity | null> => {
  return AdminActivityModel.findById(activityId)
    .populate({
      path: 'adminId',
      select: '_id name email role',
    })
    .populate({
      path: 'targetUserId',
      select: '_id name email role status',
    })
    .lean<AdminActivity | null>();
};

export const AdminActivityRepository = {
  create,
  findRecent,
  findByAdminId,
  findByTargetUserId,
  find,
  findById,
};
