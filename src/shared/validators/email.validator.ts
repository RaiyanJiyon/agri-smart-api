import z from "zod";

export const emailSchema = z
    .string({
        error: "Email is required.",
    })
    .trim()
    .toLowerCase()
    .email({
        error: "Invalid email address.",
    });