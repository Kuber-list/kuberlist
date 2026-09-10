import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
  getLiveSecondaryOpportunities,
  getMySecondaryOpportunities,
  getSecondaryOpportunity,
  expressSecondaryInterest,
  getSecondaryOpportunityInterests,
  approveSecondaryInterest,
  declineSecondaryInterest,
  createSecondaryOpportunity,
  updateSecondaryOpportunity,
  submitSecondaryOpportunity,
  withdrawSecondaryOpportunity,
  getPendingSecondaryOpportunities,
  approveSecondaryOpportunity,
  rejectSecondaryOpportunity,
} from "../controllers/secondaryOpportunity.js";

const r = express.Router();

// Public / authenticated investor routes
r.get("/", protect, getLiveSecondaryOpportunities);

r.get("/my", protect, getMySecondaryOpportunities);

r.get(
  "/admin/pending",
  protect,
  requireRole("ADMIN"),
  getPendingSecondaryOpportunities,
);

r.post("/", protect, createSecondaryOpportunity);

r.put("/:id", protect, updateSecondaryOpportunity);

r.post("/:id/interest", protect, expressSecondaryInterest);
r.get("/:id/interests", protect, getSecondaryOpportunityInterests);

r.post("/:id/interests/:interestId/approve", protect, approveSecondaryInterest);

r.post("/:id/interests/:interestId/decline", protect, declineSecondaryInterest);

r.post("/:id/submit", protect, submitSecondaryOpportunity);

r.post("/:id/withdraw", protect, withdrawSecondaryOpportunity);

r.post(
  "/:id/approve",
  protect,
  requireRole("ADMIN"),
  approveSecondaryOpportunity,
);
r.post(
  "/:id/reject",
  protect,
  requireRole("ADMIN"),
  rejectSecondaryOpportunity,
);

// Keep this LAST
r.get("/:id", protect, getSecondaryOpportunity);

export default r;
