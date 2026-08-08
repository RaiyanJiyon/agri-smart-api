import { model, Schema } from 'mongoose';
import type { Farm } from './farm.interface.js';
import { FARM_AREA_UNITS } from './farm.constant.js';
import { COLLECTION_NAME } from '../../shared/constants/index.js';

const FarmSchema = new Schema<Farm>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAME.USER,
      required: [true, 'User ID is required.'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Farm name is required.'],
      trim: true,
      minlength: [2, 'Farm name must be at least 2 characters.'],
      maxLength: [100, 'Farm name cannot exceed 100 characters.'],
    },
    location: {
      type: String,
      required: [true, 'Farm location is required.'],
      trim: true,
      maxLength: [300, 'Farm location cannot exceed 300 characters.'],
    },
    area: {
      type: Number,
      required: [true, 'Farm area is required.'],
      min: [0.01, 'Farm area must be greater than 0.'],
    },
    areaUnit: {
      type: String,
      enum: {
        values: Object.values(FARM_AREA_UNITS),
        message: 'Invalid farm area unit.',
      },
      required: [true, 'Farm area unit is required.'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const FarmModel = model<Farm>(COLLECTION_NAME.FARM, FarmSchema);
