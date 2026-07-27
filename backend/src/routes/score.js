import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { getScore, getReport, getPublicScore } from "../controllers/score.js";

const r = Router();

// Capital seeker — compute & get score/report for own listing
r.get("/listing/:id/score", protect, requireRole("CAPITAL_SEEKER"), getScore);
r.get("/listing/:id/report", protect, getReport);

// Public/investor — get stored score for any active listing
r.get("/public/:id", protect, getPublicScore);

export default r;
