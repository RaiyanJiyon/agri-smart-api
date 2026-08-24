import mongoose from 'mongoose';
import type { Profile } from '../../src/app/modules/profile/profile.interface.js';

export interface MockProfile extends Profile {
  _id: mongoose.Types.ObjectId;
}

export const createMockProfile = (overrides: Partial<MockProfile> = {}): MockProfile => {
  const profileId = overrides._id ?? new mongoose.Types.ObjectId();
  const userId = overrides.userId ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();

  return {
    _id: profileId,
    userId,
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+1234567890',
    avatar: 'https://example.com/avatar.jpg',
    address: '123 Farm Way, Agriculture Valley',
    createdAt: defaultDate,
    updatedAt: defaultDate,
    ...overrides,
  };
};
