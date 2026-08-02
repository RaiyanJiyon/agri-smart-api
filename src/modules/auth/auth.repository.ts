import type { IUser } from './auth.interface.js';
import { AuthModel } from './auth.model.js';

const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return AuthModel.findOne({ email });
};

const createUser = async (payload: Partial<IUser>): Promise<IUser> => {
  return AuthModel.create(payload);
};

export const AuthRepository = {
  findUserByEmail,
  createUser,
};
