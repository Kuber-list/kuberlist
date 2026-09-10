import { Router } from "express";

import { protect } from "../middleware/auth.js";

import {
  initialize,
  getByConnection,
  getById,
  summary,
  categories,
  recalculate,
  updateStatus,
  attachDocument,
  verify,
} from "../controllers/dueDiligence.js";

const r = Router();

/*
  INITIALIZE
*/
r.post("/connection/:connectionId", protect, initialize);

/*
  GET BY CONNECTION
*/
r.get("/connection/:connectionId", protect, getByConnection);

/*
  SUMMARY
*/
r.get("/:id/summary", protect, summary);

/*
  CATEGORY BREAKDOWN
*/
r.get("/:id/categories", protect, categories);

/*
  RECALCULATE
*/
r.post("/:id/recalculate", protect, recalculate);

/*
  REQUIREMENT STATUS
*/
r.patch("/requirements/:requirementId/status", protect, updateStatus);

/*
  ATTACH DOCUMENT
*/
r.post("/requirements/:requirementId/document", protect, attachDocument);

/*
  VERIFY
*/
r.post("/requirements/:requirementId/verify", protect, verify);

/*
  GET COMPLETE DD WORKSPACE
*/
r.get("/:id", protect, getById);

export default r;
