import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe } from 'vitest';
import { clearTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../setup';

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
    // Add your test cases for the create method here
  });

  describe('findAllByUserId', () => {
    // Add your test cases for the findAllByUserId method here
  });

  describe('findByIdAndUserId', () => {
    // Add your test cases for the findByIdAndUserId method here
  });

  describe('updateByIdAndUserId', () => {
    // Add your test cases for the updateByIdAndUserId method here
  });

  describe('deleteByIdAndUserId', () => {
    // Add your test cases for the deleteByIdAndUserId method here
  });
});
