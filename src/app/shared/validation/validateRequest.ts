import type { NextFunction, Request, Response } from 'express';
import type z from 'zod';

// In Zod v4, z.ZodType covers all schemas (Objects, Effects, Strings, etc.)
type ValidationSchema = z.ZodType;

const validateRequest =
  (schema: ValidationSchema) =>
  // Using 'unknown' to satisfy ESLint's no-unsafe-assignment rule
  (req: Request<unknown, unknown, unknown>, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies,
      });

      next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
