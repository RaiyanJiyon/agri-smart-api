import type { IJwtPayload } from '../shared/types/jwt.ts';

declare global {
  namespace Express {
    interface Request {
      user: IJwtPayload;
    }
  }
}

export {};
