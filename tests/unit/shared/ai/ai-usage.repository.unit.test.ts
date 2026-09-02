/* eslint-disable @typescript-eslint/unbound-method */
import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIUsageRepository, AIUsageModel, AI_EXECUTION_STATUS, AI_OPERATION, type AIUsage } from '../../../../src/app/shared/ai/index.js';

vi.mock('../../../../src/app/shared/ai/ai-usage/ai-usage.model.js', () => ({
  AIUsageModel: {
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
  },
}));

describe('AIUsageRepository', () => {
  const userId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an AI usage document and return object representation', async () => {
    const payload: AIUsage = {
      userId,
      operation: AI_OPERATION.CHAT,
      model: 'mistral-small-latest',
      status: AI_EXECUTION_STATUS.SUCCESS,
      latencyMs: 120,
    };

    const mockDoc = {
      ...payload,
      toObject: vi.fn().mockReturnValue(payload),
    } as unknown as AIUsage;

    vi.mocked(AIUsageModel.create).mockResolvedValueOnce(mockDoc as unknown as never);

    const result = await AIUsageRepository.create(payload);

    expect(result).toEqual(payload);
    expect(AIUsageModel.create).toHaveBeenCalledWith(payload);
  });

  it('should find AI usage records by userId sorted by createdAt desc', async () => {
    const mockLean = vi.fn().mockResolvedValueOnce([]);
    const mockSort = vi.fn().mockReturnValue({ lean: mockLean });
    vi.mocked(AIUsageModel.find).mockReturnValueOnce({ sort: mockSort } as unknown as ReturnType<typeof AIUsageModel.find>);

    const results = await AIUsageRepository.findByUserId(userId);

    expect(results).toEqual([]);
    expect(AIUsageModel.find).toHaveBeenCalledWith({ userId });
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('should find recent AI usage records with limit', async () => {
    const mockLean = vi.fn().mockResolvedValueOnce([]);
    const mockLimit = vi.fn().mockReturnValue({ lean: mockLean });
    const mockSort = vi.fn().mockReturnValue({ limit: mockLimit });
    vi.mocked(AIUsageModel.find).mockReturnValueOnce({ sort: mockSort } as unknown as ReturnType<typeof AIUsageModel.find>);

    const results = await AIUsageRepository.findRecent(5);

    expect(results).toEqual([]);
    expect(AIUsageModel.find).toHaveBeenCalledWith({});
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it('should count total AI usage documents', async () => {
    vi.mocked(AIUsageModel.countDocuments).mockResolvedValueOnce(50);

    const total = await AIUsageRepository.count();

    expect(total).toBe(50);
    expect(AIUsageModel.countDocuments).toHaveBeenCalledWith();
  });

  it('should count AI usage documents by operation', async () => {
    vi.mocked(AIUsageModel.countDocuments).mockResolvedValueOnce(20);

    const count = await AIUsageRepository.countByOperation(AI_OPERATION.DISEASE_DETECTION);

    expect(count).toBe(20);
    expect(AIUsageModel.countDocuments).toHaveBeenCalledWith({ operation: AI_OPERATION.DISEASE_DETECTION });
  });

  it('should calculate aggregate statistics across all operations', async () => {
    vi.mocked(AIUsageModel.countDocuments)
      .mockResolvedValueOnce(100) // total
      .mockResolvedValueOnce(90)  // success
      .mockResolvedValueOnce(10)  // failed
      .mockResolvedValueOnce(40)  // chat
      .mockResolvedValueOnce(30)  // crop
      .mockResolvedValueOnce(30); // disease

    vi.mocked(AIUsageModel.aggregate)
      .mockResolvedValueOnce([{ totalTokens: 15000 }]) // tokenStats
      .mockResolvedValueOnce([{ averageLatencyMs: 145.6 }]); // latencyStats

    const stats = await AIUsageRepository.getStatistics();

    expect(stats).toEqual({
      totalRequests: 100,
      successfulRequests: 90,
      failedRequests: 10,
      totalTokens: 15000,
      averageLatencyMs: 146,
      byOperation: {
        chat: 40,
        cropRecommendation: 30,
        diseaseDetection: 30,
      },
    });
  });

  it('should return default zero values when aggregate results are empty', async () => {
    vi.mocked(AIUsageModel.countDocuments)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    vi.mocked(AIUsageModel.aggregate)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const stats = await AIUsageRepository.getStatistics();

    expect(stats.totalTokens).toBe(0);
    expect(stats.averageLatencyMs).toBe(0);
  });
});
