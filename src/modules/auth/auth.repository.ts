import type { HydratedDocument, Types } from 'mongoose';
import type { IUser } from './auth.interface.js';
import { AuthModel } from './auth.model.js';

const findUserById = async (id: Types.ObjectId): Promise<HydratedDocument<IUser> | null> => {
  return AuthModel.findById(id);
};

const findUserByIdWithPassword = async (
  id: Types.ObjectId
): Promise<HydratedDocument<IUser> | null> => {
  return AuthModel.findById(id).select('+password');
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

const updatePassword = async (
  userId: Types.ObjectId,
  newPassword: string
): Promise<IUser | null> => {
  return AuthModel.findByIdAndUpdate(
    userId,
    {
      password: newPassword,
      passwordChangedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

export const AuthRepository = {
  findUserById,
  findUserByIdWithPassword,
  findUserByEmail,
  findUserByEmailWithPassword,
  createUser,
  updateVerificationStatus,
  updatePassword,
};
