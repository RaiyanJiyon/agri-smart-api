import z from "zod";

export const passwordSchema = z
    .string({
        error: "Password is required.",
    })
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password cannot exceed 100 characters.")
