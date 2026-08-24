import { beforeEach, describe, vi } from 'vitest';

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
    // Add your test cases for createFarm here
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
