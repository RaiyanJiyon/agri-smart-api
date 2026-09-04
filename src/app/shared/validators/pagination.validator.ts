import z from 'zod';

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  skip: z.number().min(0).default(0),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});
