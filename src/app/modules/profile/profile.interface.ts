import type { Types } from 'mongoose';

export interface Profile {
  userId: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  phone: string;
  avatar?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  address?: string;
}
