import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { getNotificationObjectId } from '../../../../src/app/modules/notification/notification.utils.js';

describe('getNotificationObjectId', () => {
  it('should return a valid ObjectId when given a valid hex string', () => {
    const validId = new mongoose.Types.ObjectId().toHexString();

    const result = getNotificationObjectId(validId);

    expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(result.toHexString()).toBe(validId);
  });

  it('should throw 400 ApiError when given an invalid ObjectId string', () => {
    expect(() => getNotificationObjectId('not-an-object-id')).toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid notification ID.',
      })
    );
  });

  it('should throw 400 ApiError when given an empty string', () => {
    expect(() => getNotificationObjectId('')).toThrow(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid notification ID.',
      })
    );
  });
});
