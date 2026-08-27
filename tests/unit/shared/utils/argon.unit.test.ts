import { describe, expect, it } from 'vitest';
import { comparePassword, hashPassword } from '../../../../src/app/shared/utils/argon.js';

describe('argon utility', () => {
  it('should hash a plain text password and verify match correctly', async () => {
    const plain = 'SecretPassword123!';
    const hashed = await hashPassword(plain);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(plain);

    const isMatch = await comparePassword(plain, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('WrongPassword!', hashed);
    expect(isWrongMatch).toBe(false);
  });

  it('should throw Error when comparePassword is passed an empty hashedPassword', async () => {
    await expect(comparePassword('plainText', '')).rejects.toThrow(
      'Hashed password must be a non-empty string.'
    );
  });
});
