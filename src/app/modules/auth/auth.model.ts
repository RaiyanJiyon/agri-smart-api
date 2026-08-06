import { model, Schema } from 'mongoose';
import { USER_ROLE, USER_STATUS } from './auth.constant.js';
import type { User } from './auth.interface.js';
import { COLLECTION_NAME } from '../../shared/constants/database.js';

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Exclude password from query results by default
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.FARMER,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...rest } = ret;
    return rest;
  },
});

export const AuthModel = model<User>(COLLECTION_NAME.USER, userSchema);
