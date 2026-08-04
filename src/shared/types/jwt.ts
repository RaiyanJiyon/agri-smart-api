import type { UserRole } from '../../modules/auth/auth.interface.js';

export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
