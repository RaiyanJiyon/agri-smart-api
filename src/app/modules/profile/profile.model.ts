import { model, Schema } from 'mongoose';
import type { Profile } from './profile.interface.js';
import { COLLECTION_NAME } from '../../shared/constants/database.js';

const ProfileSchema = new Schema<Profile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      required: true,
      unique: true,
      index: true,
    },

    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ProfileModel = model<Profile>(COLLECTION_NAME.PROFILE, ProfileSchema);
