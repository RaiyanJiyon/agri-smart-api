import mongoose from 'mongoose';
import type { Farm } from '../../src/app/modules/farm/farm.interface.js';
import { FARM_AREA_UNITS } from '../../src/app/modules/farm/farm.constant.js';

export interface MockFarm extends Farm {
  _id: mongoose.Types.ObjectId;
}

export const createMockFarm = (overrides: Partial<MockFarm> = {}): MockFarm => {
  const farmId = overrides._id ?? new mongoose.Types.ObjectId();
  const userId = overrides.userId ?? new mongoose.Types.ObjectId();
  const defaultDate = new Date();

  return {
    _id: farmId,
    userId,
    name: 'Green Valley Farm',
    location: 'Rangpur, Bangladesh',
    area: 10,
    areaUnit: FARM_AREA_UNITS.ACRE,
    createdAt: defaultDate,
    updatedAt: defaultDate,
    ...overrides,
  };
};

export const createMockFarmList = (count = 2, overrides: Partial<MockFarm> = {}): MockFarm[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockFarm({
      name: `Farm ${index + 1}`,
      ...overrides,
    })
  );
};
