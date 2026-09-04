import type { UserRole } from '../../modules/auth/index.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
