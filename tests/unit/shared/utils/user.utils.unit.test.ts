import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { getUserObjectId } from '../../../../src/app/shared/utils/user.utils.js';

describe('request.utils', () => {
  describe('getUserObjectId', () => {
    it('should convert valid string userId to mongoose ObjectId', () => {
      const id = new mongoose.Types.ObjectId().toString();

      const req = {
        user: {
          userId: id,
          email: 'farmer@example.com',
          role: 'FARMER',
        },
      } as Parameters<typeof getUserObjectId>[0];

      const result = getUserObjectId(req);

      expect(result).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(result.toString()).toBe(id);
    });

    it('should throw 401 UNAUTHORIZED when req.user or userId is missing', () => {
      const req1 = {} as Parameters<typeof getUserObjectId>[0];

      const req2 = {
        user: undefined,
      } as Parameters<typeof getUserObjectId>[0];

      expect(() => getUserObjectId(req1)).toThrow('User not found.');
      expect(() => getUserObjectId(req2)).toThrow('User not found.');
    });

    it('should throw 401 UNAUTHORIZED when userId is an invalid ObjectId string', () => {
      const req = {
        user: {
          userId: 'invalid-id',
          email: 'farmer@example.com',
          role: 'FARMER',
        },
      } as Parameters<typeof getUserObjectId>[0];

      expect(() => getUserObjectId(req)).toThrow('Invalid user identity.');
    });
  });
});
