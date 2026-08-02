import type { USER_ROLE, USER_STATUS } from "./auth.constant.js";

export type UserRole =
    (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type UserStatus =
    (typeof USER_STATUS)[keyof typeof USER_STATUS];

export interface IUser {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    isEmailVerified: boolean;
    status: UserStatus;
    profileImage?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}