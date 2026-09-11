import { Router } from "express";
import { getOnboarding, grantConsent, saveOnboarding } from "../controllers/onboarding.controller.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(protect);
router.post("/", asyncHandler(saveOnboarding));
router.get("/", asyncHandler(getOnboarding));
router.post("/consent", asyncHandler(grantConsent));

export default router;