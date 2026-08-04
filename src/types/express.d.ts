import type { IJwtPayload } from "./jwt.ts";

declare global {
  namespace Express {
    interface Request {
      user: IJwtPayload;
    }
  }
}

export {};