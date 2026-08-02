import { model, Schema } from "mongoose";
import { USER_ROLE, USER_STATUS } from "./auth.constant.js";
import type { IUser } from "./auth.interface.js";

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, 
    },
    password: {
        type: String,
        required: true,
        select: false, // Exclude password from query results by default
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLE),
        default: USER_ROLE.FARMER,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    profileImage: {
        type: String,
        default: null,
    },
    lastLoginAt: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        enum: Object.values(USER_STATUS),
        default: USER_STATUS.ACTIVE,
    },
}, {
    timestamps: true,
});

export const User = model<IUser>("User", userSchema);