import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { getDiseaseReportObjectId } from '../../../../src/app/modules/disease-detection/disease-detection.utils.js';

describe('getDiseaseReportObjectId', () => {
  it('should return a valid ObjectId when given a valid hex string', () => {
    const validId = new mongoose.Types.ObjectId().toHexString();

    const result = getDiseaseReportObjectId(validId);

    expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(result.toHexString()).toBe(validId);
  });

  it('should throw 400 ApiError when given an invalid ObjectId string', () => {
    expect(() => getDiseaseReportObjectId('not-a-valid-id')).toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid disease report ID.',
      })
    );
  });

  it('should throw 400 ApiError when given an empty string', () => {
    expect(() => getDiseaseReportObjectId('')).toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid disease report ID.',
      })
    );
  });
});
