import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { FarmRepository } from '../../../../src/app/modules/farm/farm.repository.js';
import { FarmModel } from '../../../../src/app/modules/farm/farm.model.js';
import { FARM_AREA_UNITS } from '../../../../src/app/modules/farm/farm.constant.js';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup.js';
import type { Farm } from '../../../../src/app/modules/farm/farm.interface.js';

describe('FarmRepository integration', () => {
  let userId: mongoose.Types.ObjectId;
  let anotherUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    userId = new mongoose.Types.ObjectId();
    anotherUserId = new mongoose.Types.ObjectId();
  });

  describe('create', () => {
    it('should create a farm in MongoDB', async () => {
      const farmPayload = {
        userId,
        name: 'Green Valley Farm',
        location: 'Rangpur, Bangladesh',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      };

      const farm = (await FarmRepository.create(farmPayload)) as Farm & {
        _id: mongoose.Types.ObjectId;
      };

      expect(farm).toBeDefined();
      expect(farm._id).toBeDefined();

      expect(farm.userId.toString()).toBe(userId.toString());
      expect(farm.name).toBe('Green Valley Farm');
      expect(farm.location).toBe('Rangpur, Bangladesh');
      expect(farm.area).toBe(10);
      expect(farm.areaUnit).toBe(FARM_AREA_UNITS.ACRE);

      expect(farm.createdAt).toBeInstanceOf(Date);
      expect(farm.updatedAt).toBeInstanceOf(Date);

      const storedFarm = await FarmModel.findById(farm._id);

      expect(storedFarm).not.toBeNull();
      expect(storedFarm?.userId.toString()).toBe(userId.toString());
    });
  });

  describe('findAllByUserId', () => {
    it('should return all farms belonging to the user', async () => {
      await FarmRepository.create({
        userId,
        name: 'Farm One',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      await FarmRepository.create({
        userId,
        name: 'Farm Two',
        location: 'Dinajpur',
        area: 5,
        areaUnit: FARM_AREA_UNITS.HECTARE,
      });

      const farms = await FarmRepository.findAllByUserId(userId);

      expect(farms).toHaveLength(2);

      expect(farms.every((farm) => farm.userId.toString() === userId.toString())).toBe(true);

      expect(farms.map((farm) => farm.name)).toEqual(
        expect.arrayContaining(['Farm One', 'Farm Two'])
      );
    });

    it('should not return farms belonging to another user', async () => {
      await FarmRepository.create({
        userId,
        name: 'My Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      });

      await FarmRepository.create({
        userId: anotherUserId,
        name: 'Another User Farm',
        location: 'Dhaka',
        area: 20,
        areaUnit: FARM_AREA_UNITS.HECTARE,
      });

      const farms = await FarmRepository.findAllByUserId(userId);

      expect(farms).toHaveLength(1);
      expect(farms[0]?.name).toBe('My Farm');
      expect(farms[0]?.userId.toString()).toBe(userId.toString());
    });

    it('should return farms ordered by newest first', async () => {
      const firstFarm = (await FarmRepository.create({
        userId,
        name: 'Old Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      })) as Farm & { _id: mongoose.Types.ObjectId };

      // Ensure createdAt values are different.
      await new Promise((resolve) => setTimeout(resolve, 10));

      const secondFarm = (await FarmRepository.create({
        userId,
        name: 'New Farm',
        location: 'Dinajpur',
        area: 20,
        areaUnit: FARM_AREA_UNITS.HECTARE,
      })) as Farm & { _id: mongoose.Types.ObjectId };

      const farms = (await FarmRepository.findAllByUserId(userId)) as (Farm & {
        _id: mongoose.Types.ObjectId;
      })[];

      expect(farms).toHaveLength(2);
      expect(farms[0]?._id.toString()).toBe(secondFarm._id.toString());
      expect(farms[1]?._id.toString()).toBe(firstFarm._id.toString());
    });
  });

  describe('findByIdAndUserId', () => {
    it('should find a farm when farmId and userId match', async () => {
      const farm = (await FarmRepository.create({
        userId,
        name: 'Green Valley Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      })) as Farm & { _id: mongoose.Types.ObjectId };

      const result = (await FarmRepository.findByIdAndUserId(farm._id, userId)) as
        (Farm & { _id: mongoose.Types.ObjectId }) | null;

      expect(result).not.toBeNull();
      expect(result?._id.toString()).toBe(farm._id.toString());
      expect(result?.userId.toString()).toBe(userId.toString());
    });

    it('should return null when the farm belongs to another user', async () => {
      const farm = (await FarmRepository.create({
        userId,
        name: 'Private Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      })) as Farm & { _id: mongoose.Types.ObjectId };

      const result = await FarmRepository.findByIdAndUserId(farm._id, anotherUserId);

      expect(result).toBeNull();
    });

    it('should return null when the farm does not exist', async () => {
      const farmId = new mongoose.Types.ObjectId();

      const result = await FarmRepository.findByIdAndUserId(farmId, userId);

      expect(result).toBeNull();
    });
  });

  describe('updateByIdAndUserId', () => {
    it('should update a farm belonging to the user', async () => {
      const farm = (await FarmRepository.create({
        userId,
        name: 'Old Farm Name',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      })) as Farm & { _id: mongoose.Types.ObjectId };

      const updatedFarm = (await FarmRepository.updateByIdAndUserId(farm._id, userId, {
        name: 'Updated Farm Name',
        location: 'Dinajpur',
        area: 15,
        areaUnit: FARM_AREA_UNITS.HECTARE,
      })) as (Farm & { _id: mongoose.Types.ObjectId }) | null;

      expect(updatedFarm).not.toBeNull();

      expect(updatedFarm?._id.toString()).toBe(farm._id.toString());
      expect(updatedFarm?.userId.toString()).toBe(userId.toString());

      expect(updatedFarm?.name).toBe('Updated Farm Name');
      expect(updatedFarm?.location).toBe('Dinajpur');
      expect(updatedFarm?.area).toBe(15);
      expect(updatedFarm?.areaUnit).toBe(FARM_AREA_UNITS.HECTARE);
    });

    it('should update only the provided fields', async () => {
      const farm = (await FarmRepository.create({
        userId,
        name: 'Original Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      })) as Farm & { _id: mongoose.Types.ObjectId };

      const updatedFarm = await FarmRepository.updateByIdAndUserId(farm._id, userId, {
        area: 25,
      });

      expect(updatedFarm).not.toBeNull();

      expect(updatedFarm?.name).toBe('Original Farm');
      expect(updatedFarm?.location).toBe('Rangpur');
      expect(updatedFarm?.area).toBe(25);
      expect(updatedFarm?.areaUnit).toBe(FARM_AREA_UNITS.ACRE);
    });

    it('should return null when the farm belongs to another user', async () => {
      const farm = (await FarmRepository.create({
        userId,
        name: 'Private Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      })) as Farm & { _id: mongoose.Types.ObjectId };

      const result = await FarmRepository.updateByIdAndUserId(farm._id, anotherUserId, {
        name: 'Hacked Farm',
      });

      expect(result).toBeNull();

      const unchangedFarm = await FarmModel.findById(farm._id);

      expect(unchangedFarm?.name).toBe('Private Farm');
      expect(unchangedFarm?.userId.toString()).toBe(userId.toString());
    });

    it('should return null when the farm does not exist', async () => {
      const farmId = new mongoose.Types.ObjectId();

      const result = await FarmRepository.updateByIdAndUserId(farmId, userId, {
        name: 'Updated Farm',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteByIdAndUserId', () => {
    it('should delete a farm belonging to the user', async () => {
      const farm = (await FarmRepository.create({
        userId,
        name: 'Farm To Delete',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      })) as Farm & { _id: mongoose.Types.ObjectId };

      const deletedFarm = await FarmRepository.deleteByIdAndUserId(farm._id, userId);

      expect(deletedFarm).not.toBeNull();
      expect(deletedFarm?._id.toString()).toBe(farm._id.toString());

      const storedFarm = await FarmModel.findById(farm._id);

      expect(storedFarm).toBeNull();
    });

    it('should not delete a farm belonging to another user', async () => {
      const farm = (await FarmRepository.create({
        userId,
        name: 'Protected Farm',
        location: 'Rangpur',
        area: 10,
        areaUnit: FARM_AREA_UNITS.ACRE,
      })) as Farm & { _id: mongoose.Types.ObjectId };

      const deletedFarm = await FarmRepository.deleteByIdAndUserId(farm._id, anotherUserId);

      expect(deletedFarm).toBeNull();

      const storedFarm = await FarmModel.findById(farm._id);

      expect(storedFarm).not.toBeNull();
      expect(storedFarm?.name).toBe('Protected Farm');
      expect(storedFarm?.userId.toString()).toBe(userId.toString());
    });

    it('should return null when the farm does not exist', async () => {
      const farmId = new mongoose.Types.ObjectId();

      const deletedFarm = await FarmRepository.deleteByIdAndUserId(farmId, userId);

      expect(deletedFarm).toBeNull();
    });
  });
});
