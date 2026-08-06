import type { JwtPayload } from '../shared/types/jwt.ts';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export {};
