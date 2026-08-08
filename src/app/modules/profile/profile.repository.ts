import type { Types } from 'mongoose';
import type { Profile } from './profile.interface.js';
import { ProfileModel } from './profile.model.js';

export const create = async (payload: Profile): Promise<Profile> => {
  return ProfileModel.create(payload);
};

export const findByUserId = async (userId: Types.ObjectId): Promise<Profile | null> => {
  return ProfileModel.findOne({
    userId: userId,
  });
};

export const updateByUserId = async (
  userId: Types.ObjectId,
  payload: Partial<Profile>
): Promise<Profile | null> => {
  return ProfileModel.findOneAndUpdate(
    {
      userId: userId,
    },
    { $set: payload },
    {
      runValidators: true,
      new: true,
    }
  );
};

export const ProfileRepository = {
  create,
  findByUserId,
  updateByUserId,
};
