import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

export const validateRequest = (schema: z.ZodTypeAny) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Casting directly on assignment blocks the 'any' error
            const body = req.body as Record<string, unknown>;

            const payload = typeof body?.data === "string" 
                ? JSON.parse(body.data) as unknown 
                : body;

            req.body = await schema.parseAsync(payload);
            next();
        } catch (error) {
            next(error);
        }
    };
};
