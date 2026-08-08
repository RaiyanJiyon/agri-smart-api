import { z } from 'zod';

import { FARM_AREA_UNITS } from './farm.constant.js';

const areaUnitSchema = z.enum(Object.values(FARM_AREA_UNITS) as [string, ...string[]]);

const createFarmBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Farm name must be at least 2 characters.')
      .max(100, 'Farm name cannot exceed 100 characters.'),

    location: z
      .string()
      .trim()
      .min(2, 'Farm location must be at least 2 characters.')
      .max(300, 'Farm location cannot exceed 300 characters.'),

    area: z.number().positive('Farm area must be greater than 0.'),

    areaUnit: areaUnitSchema,
  })
  .strict();

const updateFarmBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Farm name must be at least 2 characters.')
      .max(100, 'Farm name cannot exceed 100 characters.')
      .optional(),

    location: z
      .string()
      .trim()
      .min(2, 'Farm location must be at least 2 characters.')
      .max(300, 'Farm location cannot exceed 300 characters.')
      .optional(),

    area: z.number().positive('Farm area must be greater than 0.').optional(),

    areaUnit: areaUnitSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one farm field must be provided.',
  });

export const createFarmValidationSchema = z.object({
  body: createFarmBodySchema,
});

export const updateFarmValidationSchema = z.object({
  body: updateFarmBodySchema,
});
