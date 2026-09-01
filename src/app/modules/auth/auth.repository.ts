import type { ClientSession, HydratedDocument, Types } from 'mongoose';
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

const createUser = async (
  payload: Partial<User>,
  session?: ClientSession
): Promise<HydratedDocument<User> | null> => {
  const options = session ? { session } : undefined;
  const [user] = await AuthModel.create([payload], options);

  return user ?? null;
};

const updateLastLogin = async (userId: Types.ObjectId): Promise<HydratedDocument<User> | null> => {
  return AuthModel.findByIdAndUpdate(
    { _id: userId },
    { lastLoginAt: new Date() },
    { returnDocument: 'after' }
  );
};

const updateVerificationStatus = async (
  userId: Types.ObjectId,
  isEmailVerified: boolean
): Promise<HydratedDocument<User> | null> => {
  return AuthModel.findByIdAndUpdate(
    { _id: userId },
    { isEmailVerified },
    { returnDocument: 'after' }
  );
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
      returnDocument: 'after',
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
