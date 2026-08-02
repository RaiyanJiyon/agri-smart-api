import type { HydratedDocument, Types } from 'mongoose';
import type { IUser } from './auth.interface.js';
import { AuthModel } from './auth.model.js';

const findById = async (id: Types.ObjectId): Promise<HydratedDocument<IUser> | null> => {
  return AuthModel.findById(id);
};

const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return AuthModel.findOne({ email });
};

const createUser = async (payload: Partial<IUser>): Promise<IUser> => {
  return AuthModel.create(payload);
};

const updateVerificationStatus = async (
  userId: Types.ObjectId,
  isEmailVerified: boolean
): Promise<IUser | null> => {
  return AuthModel.findByIdAndUpdate(userId, { isEmailVerified }, { new: true });
};

export const AuthRepository = {
  findById,
  findUserByEmail,
  createUser,
  updateVerificationStatus,
};
