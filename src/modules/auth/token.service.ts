import type { IUser } from "./auth.interface.js";

export interface IGenerateAuthTokensPayload {
  user: IUser;

  ipAddress?: string;

  userAgent?: string;
}