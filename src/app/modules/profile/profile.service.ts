import type { Types } from 'mongoose';
import { ProfileRepository } from './profile.repository.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import type { Profile } from './profile.interface.js';
import { HTTP_STATUS } from '../../shared/constants/httpStatus.js';

const getMyProfile = async (userId: Types.ObjectId) => {
  const profile = await ProfileRepository.findByUserId(userId);

  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Profile not found.');
  }

  return profile;
};

const updateMyProfile = async (userId: Types.ObjectId, payload: Partial<Profile>) => {
  const profile = await ProfileRepository.updateByUserId(userId, payload);

  if (!profile) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Profile not found.');
  }

  return profile;
};

export const ProfileService = {
  getMyProfile,
  updateMyProfile,
};
