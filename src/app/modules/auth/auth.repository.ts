import type { HydratedDocument, Types } from 'mongoose';
import type { User } from './auth.interface.js';
import { AuthModel } from './auth.model.js';

const findUserById = async (id: Types.ObjectId): Promise<HydratedDocument<User> | null> => {
  return AuthModel.findById(id);
};

const findUserByIdWithPassword = async (
  id: Types.ObjectId
): Promise<HydratedDocument<User> | null> => {
  return AuthModel.findById(id).select('+password');
};

const findUserByEmail = async (email: string): Promise<HydratedDocument<User> | null> => {
  return AuthModel.findOne({ email });
};

const findUserByEmailWithPassword = async (
  email: string
): Promise<HydratedDocument<User> | null> => {
  return AuthModel.findOne({ email }).select('+password');
};

const createUser = async (payload: Partial<User>): Promise<HydratedDocument<User>> => {
  return AuthModel.create(payload);
};

const updateLastLogin = async (userId: Types.ObjectId): Promise<HydratedDocument<User> | null> => {
  return AuthModel.findByIdAndUpdate({ _id: userId }, { lastLoginAt: new Date() }, { new: true });
};

const updateVerificationStatus = async (
  userId: Types.ObjectId,
  isEmailVerified: boolean
): Promise<HydratedDocument<User> | null> => {
  return AuthModel.findByIdAndUpdate({ _id: userId }, { isEmailVerified }, { new: true });
};

const updatePassword = async (
  userId: Types.ObjectId,
  newPassword: string
): Promise<User | null> => {
  return AuthModel.findByIdAndUpdate(
    { _id: userId },
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
  updateLastLogin,
  updateVerificationStatus,
  updatePassword,
};
