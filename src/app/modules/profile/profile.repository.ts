import type { ClientSession, Types } from 'mongoose';
import type { Profile } from './profile.interface.js';
import { ProfileModel } from './profile.model.js';

const create = async (payload: Profile, session?: ClientSession): Promise<Profile> => {
  const options = session ? { session } : undefined;
  const [profile] = await ProfileModel.create([payload], options);

  return profile!;
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
      returnDocument: 'after',
    }
  );
};

export const ProfileRepository = {
  create,
  findByUserId,
  updateByUserId,
};
