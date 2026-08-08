import type { Types } from 'mongoose';
import type { FARM_AREA_UNITS } from './farm.constant.js';

export type FarmAreaUnit = (typeof FARM_AREA_UNITS)[keyof typeof FARM_AREA_UNITS];

export interface Farm {
  userId: Types.ObjectId;

  name: string;

  location: string;

  area: number;

  areaUnit: FarmAreaUnit;

  createdAt?: Date;

  updatedAt?: Date;
}
