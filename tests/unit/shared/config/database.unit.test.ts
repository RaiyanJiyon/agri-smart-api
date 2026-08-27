import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectDatabase } from '../../../../src/app/shared/config/database.js';

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn(),
  },
}));

describe('connectDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should connect to MongoDB successfully on first attempt', async () => {
    vi.mocked(mongoose.connect).mockResolvedValue(mongoose);

    await expect(connectDatabase()).resolves.toBeUndefined();
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    vi.mocked(mongoose.connect)
      .mockRejectedValueOnce(new Error('Connection timeout'))
      .mockResolvedValueOnce(mongoose);

    const promise = connectDatabase();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBeUndefined();

    expect(mongoose.connect).toHaveBeenCalledTimes(2);
  });

  it('should exit process when max retries are exhausted', async () => {
    vi.mocked(mongoose.connect).mockRejectedValue(new Error('Persistent connection failure'));

    const processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: string | number | null): never => undefined as never);

    const promise = connectDatabase();

    await vi.runAllTimersAsync();
    await promise;

    expect(mongoose.connect).toHaveBeenCalledTimes(5);
    expect(processExitSpy).toHaveBeenCalledWith(1);

    processExitSpy.mockRestore();
  });
});
