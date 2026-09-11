import { Router } from "express";

import {
  getCustomer,
  getCustomers,
  getOpportunities
} from "../controllers/ecobank.controller.js";

import {
  protect,
  requireRole
} from "../middleware/auth.js";

import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/*
 * Customer-facing opportunities.
 *
 * Any authenticated TrustID user can access this.
 */
router.get(
  "/opportunities",
  protect,
  asyncHandler(getOpportunities)
);

/*
 * Ecobank officer/admin customer intelligence.
 *
 * These endpoints remain restricted.
 */
router.use(
  protect,
  requireRole("ECOBANK_OFFICER", "ADMIN")
);

router.get(
  "/customers",
  asyncHandler(getCustomers)
);

router.get(
  "/customers/:id",
  asyncHandler(getCustomer)
);

export default router;