import type { UserRole } from '../../modules/auth/auth.interface.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
