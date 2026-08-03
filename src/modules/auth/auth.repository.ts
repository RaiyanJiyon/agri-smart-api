import type { HydratedDocument, Types } from 'mongoose';
import type { IUser } from './auth.interface.js';
import { AuthModel } from './auth.model.js';

const findById = async (id: Types.ObjectId): Promise<HydratedDocument<IUser> | null> => {
  return AuthModel.findById(id);
};

const findUserByEmail = async (email: string): Promise<HydratedDocument<IUser> | null> => {
  return AuthModel.findOne({ email });
};

const findUserByEmailWithPassword = async (
  email: string
): Promise<HydratedDocument<IUser> | null> => {
  return AuthModel.findOne({ email }).select('+password');
};

const createUser = async (payload: Partial<IUser>): Promise<HydratedDocument<IUser>> => {
  return AuthModel.create(payload);
};

const updateVerificationStatus = async (
  userId: Types.ObjectId,
  isEmailVerified: boolean
): Promise<HydratedDocument<IUser> | null> => {
  return AuthModel.findByIdAndUpdate(userId, { isEmailVerified }, { new: true });
};

export const AuthRepository = {
  findById,
  findUserByEmail,
  findUserByEmailWithPassword,
  createUser,
  updateVerificationStatus,
};
