import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FarmRepository } from '../../../../src/app/modules/farm/farm.repository.js';
import { FarmService } from '../../../../src/app/modules/farm/farm.service.js';

vi.mock('../../../../src/app/modules/farm/farm.repository.js', () => ({
  FarmRepository: {
    create: vi.fn(),
    findAllByUserId: vi.fn(),
    findByIdAndUserId: vi.fn(),
    updateByIdAndUserId: vi.fn(),
    deleteByIdAndUserId: vi.fn(),
  },
}));

describe('FarmService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFarm', () => {
    it('should create a farm with the userId attached to the payload', async () => {
      const userId = new mongoose.Types.ObjectId();

      const payload = {
        name: 'Green Valley Farm',
        location: 'Rajshahi',
        area: 10,
        areaUnit: 'acre' as const,
      };

      const createdFarm = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(FarmRepository.create).mockResolvedValue(createdFarm);

      const result = await FarmService.createFarm(userId, payload);

      expect(result).toEqual(createdFarm);

      expect(FarmRepository.create).toHaveBeenCalledWith({
        userId,
        ...payload,
      });
    });
  });

  describe('getMyFarms', () => {
    // Add your test cases for getMyFarms here
  });

  describe('getMyFarm', () => {
    // Add your test cases for getMyFarm here
  });

  describe('updateMyFarm', () => {
    // Add your test cases for updateMyFarm here
  });

  describe('deleteMyFarm', () => {
    // Add your test cases for deleteMyFarm here
  });
});
