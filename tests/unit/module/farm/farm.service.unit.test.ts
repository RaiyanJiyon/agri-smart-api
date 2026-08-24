import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FarmRepository } from '../../../../src/app/modules/farm/farm.repository.js';
import { FarmService } from '../../../../src/app/modules/farm/farm.service.js';
import { createMockFarm, createMockFarmList } from '../../../fixtures/index.js';

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

      const createdFarm = createMockFarm({ userId, ...payload });

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
    it('should return all farms belonging to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farms = createMockFarmList(2, { userId });

      vi.mocked(FarmRepository.findAllByUserId).mockResolvedValue(farms);

      const result = await FarmService.getMyFarms(userId);

      expect(result).toEqual(farms);

      expect(FarmRepository.findAllByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return an empty array when the user has no farms', async () => {
      const userId = new mongoose.Types.ObjectId();

      vi.mocked(FarmRepository.findAllByUserId).mockResolvedValue([]);

      const result = await FarmService.getMyFarms(userId);

      expect(result).toEqual([]);

      expect(FarmRepository.findAllByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getMyFarm', () => {
    it('should return the farm when it belongs to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farmId = new mongoose.Types.ObjectId();

      const farm = createMockFarm({ _id: farmId, userId });

      vi.mocked(FarmRepository.findByIdAndUserId).mockResolvedValue(farm);

      const result = await FarmService.getMyFarm(userId, farmId);

      expect(result).toEqual(farm);

      expect(FarmRepository.findByIdAndUserId).toHaveBeenCalledWith(farmId, userId);
    });

    it('should throw NOT_FOUND when the farm does not exist or does not belong to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farmId = new mongoose.Types.ObjectId();

      vi.mocked(FarmRepository.findByIdAndUserId).mockResolvedValue(null);

      await expect(FarmService.getMyFarm(userId, farmId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Farm not found.',
      });

      expect(FarmRepository.findByIdAndUserId).toHaveBeenCalledWith(farmId, userId);
    });
  });

  describe('updateMyFarm', () => {
    it('should update the farm when it belongs to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farmId = new mongoose.Types.ObjectId();

      const payload = {
        name: 'Updated Farm',
        area: 15,
      };

      const updatedFarm = createMockFarm({ _id: farmId, userId, ...payload });

      vi.mocked(FarmRepository.updateByIdAndUserId).mockResolvedValue(updatedFarm);

      const result = await FarmService.updateMyFarm(userId, farmId, payload);

      expect(result).toEqual(updatedFarm);

      expect(FarmRepository.updateByIdAndUserId).toHaveBeenCalledWith(farmId, userId, payload);
    });

    it('should throw NOT_FOUND when the farm does not exist or does not belong to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farmId = new mongoose.Types.ObjectId();

      const payload = {
        name: 'Updated Farm',
      };

      vi.mocked(FarmRepository.updateByIdAndUserId).mockResolvedValue(null);

      await expect(FarmService.updateMyFarm(userId, farmId, payload)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Farm not found.',
      });

      expect(FarmRepository.updateByIdAndUserId).toHaveBeenCalledWith(farmId, userId, payload);
    });
  });

  describe('deleteMyFarm', () => {
    it('should delete the farm when it belongs to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farmId = new mongoose.Types.ObjectId();

      const deletedFarm = createMockFarm({ _id: farmId, userId });

      vi.mocked(FarmRepository.deleteByIdAndUserId).mockResolvedValue(
        deletedFarm as unknown as never
      );

      await expect(FarmService.deleteMyFarm(userId, farmId)).resolves.toBeUndefined();

      expect(FarmRepository.deleteByIdAndUserId).toHaveBeenCalledWith(farmId, userId);
    });

    it('should throw NOT_FOUND when the farm does not exist or does not belong to the user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const farmId = new mongoose.Types.ObjectId();

      vi.mocked(FarmRepository.deleteByIdAndUserId).mockResolvedValue(null);

      await expect(FarmService.deleteMyFarm(userId, farmId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Farm not found.',
      });

      expect(FarmRepository.deleteByIdAndUserId).toHaveBeenCalledWith(farmId, userId);
    });
  });
});
