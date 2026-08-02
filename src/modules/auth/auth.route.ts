import { Router } from "express";
import validateRequest from "../../shared/validation/validateRequest.js";
import { registerValidationSchema } from "./auth.validation.js";

const router = Router();

router.post(
    "/register",
    validateRequest(registerValidationSchema),
    
)