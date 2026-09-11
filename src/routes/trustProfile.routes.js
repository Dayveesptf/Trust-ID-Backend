import { Router } from "express";
import {
  generateTrustProfile,
  getInsights,
  getScoreHistory,
  getTrustProfile
} from "../controllers/trustProfile.controller.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(protect);
router.post("/generate", asyncHandler(generateTrustProfile));
router.get("/", asyncHandler(getTrustProfile));
router.get("/history", asyncHandler(getScoreHistory));
router.get("/insights", asyncHandler(getInsights));

export default router;