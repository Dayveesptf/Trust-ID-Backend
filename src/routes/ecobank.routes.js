import { Router } from "express";
import {
  getCustomer,
  getCustomers,
  getDashboardSummary,
  getOpportunities,
  saveCustomerReview
} from "../controllers/ecobank.controller.js";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Customer-facing opportunities stay available to all authenticated users.
router.get("/opportunities", protect, asyncHandler(getOpportunities));

// Every endpoint below this point is restricted to authorised bank staff.
router.use(protect, requireRole("ECOBANK_OFFICER", "ADMIN"));

router.get("/summary", asyncHandler(getDashboardSummary));
router.get("/customers", asyncHandler(getCustomers));
router.get("/customers/:id", asyncHandler(getCustomer));
router.put("/customers/:id/review", asyncHandler(saveCustomerReview));

export default router;
