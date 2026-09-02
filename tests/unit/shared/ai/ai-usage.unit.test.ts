import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIUsageService, AIUsageRepository, AI_EXECUTION_STATUS,
  AI_OPERATION, type AIUsage, type AIUsageStatistics } from '../../../../src/app/shared/ai/index.js';

vi.mock('../../../../src/app/shared/ai/ai-usage/ai-usage.repository.js', () => ({
  AIUsageRepository: {
    create: vi.fn(),
    findByUserId: vi.fn(),
    findRecent: vi.fn(),
    count: vi.fn(),
    countByOperation: vi.fn(),
    getStatistics: vi.fn(),
  },
}));

describe('AIUsageService', () => {
  const userId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate record to repository', async () => {
    const payload: AIUsage = {
      userId,
      operation: AI_OPERATION.CHAT,
      model: 'mistral-small-latest',
      status: AI_EXECUTION_STATUS.SUCCESS,
      latencyMs: 150,
    };

    vi.mocked(AIUsageRepository.create).mockResolvedValueOnce(payload);

    const result = await AIUsageService.record(payload);

    expect(result).toEqual(payload);
    expect(AIUsageRepository.create).toHaveBeenCalledWith(payload);
  });

  it('should delegate getByUserId to repository', async () => {
    vi.mocked(AIUsageRepository.findByUserId).mockResolvedValueOnce([]);

    const result = await AIUsageService.getByUserId(userId);

    expect(result).toEqual([]);
    expect(AIUsageRepository.findByUserId).toHaveBeenCalledWith(userId);
  });

  it('should delegate getRecent to repository', async () => {
    vi.mocked(AIUsageRepository.findRecent).mockResolvedValueOnce([]);

    const result = await AIUsageService.getRecent(10);

    expect(result).toEqual([]);
    expect(AIUsageRepository.findRecent).toHaveBeenCalledWith(10);
  });

  it('should delegate getTotalCount to repository', async () => {
    vi.mocked(AIUsageRepository.count).mockResolvedValueOnce(42);

    const count = await AIUsageService.getTotalCount();

    expect(count).toBe(42);
    expect(AIUsageRepository.count).toHaveBeenCalled();
  });

  it('should delegate getCountByOperation to repository', async () => {
    vi.mocked(AIUsageRepository.countByOperation).mockResolvedValueOnce(15);

    const count = await AIUsageService.getCountByOperation(AI_OPERATION.DISEASE_DETECTION);

    expect(count).toBe(15);
    expect(AIUsageRepository.countByOperation).toHaveBeenCalledWith(AI_OPERATION.DISEASE_DETECTION);
  });

  it('should delegate getStatistics to repository', async () => {
    const mockStats: AIUsageStatistics = {
      totalRequests: 100,
      successfulRequests: 95,
      failedRequests: 5,
      totalTokens: 5000,
      averageLatencyMs: 120,
      byOperation: {
        chat: 60,
        cropRecommendation: 25,
        diseaseDetection: 15,
      },
    };

    vi.mocked(AIUsageRepository.getStatistics).mockResolvedValueOnce(mockStats);

    const stats = await AIUsageService.getStatistics();

    expect(stats).toEqual(mockStats);
    expect(AIUsageRepository.getStatistics).toHaveBeenCalled();
  });
});
