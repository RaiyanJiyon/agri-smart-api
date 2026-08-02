import z from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const objectIdSchema = z
    .string({
        error: "ObjectId is required.",
    })
    .regex(objectIdRegex, "Invalid ObjectId format.")
