import { Router } from "express";
import {
  getOnboarding,
  grantConsent,
  saveOnboarding,
  updateEcobankSharingConsent
} from "../controllers/onboarding.controller.js";
import { protect } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(protect);
router.post("/", asyncHandler(saveOnboarding));
router.get("/", asyncHandler(getOnboarding));
router.post("/consent", asyncHandler(grantConsent));
router.post("/share-with-ecobank", asyncHandler(updateEcobankSharingConsent));
router.delete("/share-with-ecobank", (req, res, next) => {
  req.body = { granted: false };
  next();
}, asyncHandler(updateEcobankSharingConsent));

export default router;
