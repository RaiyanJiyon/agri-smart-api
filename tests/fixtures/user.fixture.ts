import mongoose from 'mongoose';
import type { User } from '../../src/app/modules/auth/auth.interface.js';

export interface MockUser extends User {
  _id: mongoose.Types.ObjectId;
}

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => {
  const userId = overrides._id ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();

  return {
    _id: userId,
    name: 'Test Farmer',
    email: 'farmer@example.com',
    password: '$argon2id$v=19$m=65536,t=1,p=1$mockHashedPasswordValue',
    role: 'farmer',
    isEmailVerified: true,
    status: 'active',
    passwordChangedAt: defaultDate,
    createdAt: defaultDate,
    updatedAt: defaultDate,
    ...overrides,
  };
};

export const createMockUserList = (count = 2, overrides: Partial<MockUser> = {}): MockUser[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      name: `Test Farmer ${index + 1}`,
      email: `farmer${index + 1}@example.com`,
      ...overrides,
    })
  );
};
