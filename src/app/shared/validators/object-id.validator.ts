import z from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const objectIdSchema = z
  .string({
    message: 'ObjectId is required.',
  })
  .min(1, 'ObjectId is required.')
  .regex(objectIdRegex, 'Invalid ObjectId format.');
