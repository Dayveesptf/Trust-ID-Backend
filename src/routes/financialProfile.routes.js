import { Router } from "express";
import { getFinancialProfile, upsertFinancialProfile } from "../controllers/financialProfile.controller.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(protect);
router.post("/", asyncHandler(upsertFinancialProfile));
router.get("/", asyncHandler(getFinancialProfile));

export default router;