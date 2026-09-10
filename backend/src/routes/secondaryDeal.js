import express from "express";

import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import {
  getMySecondaryDeals,
  getSecondaryDeal,
  getSecondaryDealMessages,
  sendSecondaryDealMessage,
  updateSecondaryDealStatus,
  getSecondaryDealDocuments,
  createSecondaryDealDocument,
  requestSecondaryDealDocument,
  getSecondaryDealDocumentRequests,
  fulfillSecondaryDealDocumentRequest,
} from "../controllers/secondaryDeal.js";

const r = express.Router();

r.get("/my", protect, getMySecondaryDeals);

// Secondary deal chat
r.get("/:id/messages", protect, getSecondaryDealMessages);

r.post("/:id/messages", protect, sendSecondaryDealMessage);

// Secondary deal status
r.patch("/:id/status", protect, updateSecondaryDealStatus);
// Secondary deal documents
r.get("/:id/documents", protect, getSecondaryDealDocuments);

r.post(
  "/:id/documents",
  protect,
  upload.single("file"),
  createSecondaryDealDocument,
);

// Secondary deal document requests
r.get("/:id/document-requests", protect, getSecondaryDealDocumentRequests);

r.post("/:id/document-requests", protect, requestSecondaryDealDocument);

r.patch(
  "/:id/document-requests/:requestId",
  protect,
  upload.single("file"),
  fulfillSecondaryDealDocumentRequest,
);

// Keep this LAST
r.get("/:id", protect, getSecondaryDeal);

export default r;
