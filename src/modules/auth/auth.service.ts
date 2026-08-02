import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ApiError } from '../../errors/AppError.js';
import { hashPassword } from '../../utils/argon.js';
import type { IUser } from './auth.interface.js';
import { AuthRepository } from './auth.repository.js';

const register = async (payload: Pick<IUser, 'name' | 'email' | 'password'>): Promise<IUser> => {
  const existingUser = await AuthRepository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'User already exists.');
  }

  const hashedPassword = await hashPassword(payload.password);

  const user = await AuthRepository.createUser({
    ...payload,
    password: hashedPassword,
  });

  return user;
};

export const AuthService = {
  register,
};
