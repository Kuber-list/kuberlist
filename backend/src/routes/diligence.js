import { Router } from "express";

import { protect, requireRole } from "../middleware/auth.js";

import {
  createRequest,
  getRequests,
  respondToRequest,
  completeRequest,
} from "../controllers/diligence.js";

import { validateAcceptedInterest } from "../middleware/connection.js";
const r = Router();

/*
  INVESTOR CREATES REQUEST
*/

r.post(
  "/request",
  protect,
  requireRole("INVESTOR"),
  validateAcceptedInterest,
  createRequest,
);

/*
  GET ALL REQUESTS
*/

r.get(
  "/startup/:startupId",

  protect,

  getRequests,
);

/*
  STARTUP RESPONDS
*/

r.patch(
  "/:id/respond",

  protect,

  requireRole("CAPITAL_SEEKER"),

  respondToRequest,
);

/*
  INVESTOR MARKS COMPLETE
*/

r.patch(
  "/:id/complete",

  protect,

  requireRole("INVESTOR"),

  completeRequest,
);

export default r;
