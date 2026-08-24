import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileService } from '../../../../src/app/modules/profile/profile.service.js';
import { ProfileRepository } from '../../../../src/app/modules/profile/profile.repository.js';
import { createMockProfile } from '../../../fixtures/index.js';

vi.mock('../../../../src/app/modules/profile/profile.repository.js', () => ({
  ProfileRepository: {
    create: vi.fn(),
    findByUserId: vi.fn(),
    updateByUserId: vi.fn(),
  },
}));

describe('ProfileService.getMyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the profile when the profile exists', async () => {
    const userId = new mongoose.Types.ObjectId();
    const profile = createMockProfile({ userId, firstName: 'Raiyan', lastName: 'Jiyon', address: 'Dhaka, Bangladesh' });

    vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(profile);

    const result = await ProfileService.getMyProfile(userId);

    expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);

    expect(result).toEqual(profile);
  });

  it('should reject when the profile does not exist', async () => {
    const userId = new mongoose.Types.ObjectId();

    vi.mocked(ProfileRepository.findByUserId).mockResolvedValue(null);

    await expect(ProfileService.getMyProfile(userId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Profile not found.',
    });

    expect(ProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
  });
});

describe('ProfileService.updateMyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update and return the profile when the profile exists', async () => {
    const userId = new mongoose.Types.ObjectId();

    const payload = {
      firstName: 'Raiyan',
      lastName: 'Jiyon',
      phone: '01700000000',
      address: 'Dhaka, Bangladesh',
    };

    const updatedProfile = createMockProfile({ userId, ...payload });

    vi.mocked(ProfileRepository.updateByUserId).mockResolvedValue(updatedProfile);

    const result = await ProfileService.updateMyProfile(userId, payload);

    expect(ProfileRepository.updateByUserId).toHaveBeenCalledWith(userId, payload);

    expect(result).toEqual(updatedProfile);
  });

  it('should reject when the profile does not exist', async () => {
    const userId = new mongoose.Types.ObjectId();

    const payload = {
      firstName: 'Raiyan',
      lastName: 'Jiyon',
    };

    vi.mocked(ProfileRepository.updateByUserId).mockResolvedValue(null);

    await expect(ProfileService.updateMyProfile(userId, payload)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Profile not found.',
    });

    expect(ProfileRepository.updateByUserId).toHaveBeenCalledWith(userId, payload);
  });
});
