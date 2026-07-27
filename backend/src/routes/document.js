import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  getAccessLogs,
  verifyDocument,
  getAllDocumentsForAdmin,
  downloadDocument,
} from "../controllers/document.js";
import { upload } from "../middleware/upload.js";
const r = Router();
r.post(
  "/upload",
  protect,
  requireRole("CAPITAL_SEEKER"),
  upload.single("file"),
  uploadDocument,
);
r.get("/startup/:startupId", protect, getDocuments);
r.get("/:id/download", protect, downloadDocument);
r.delete("/:id", protect, requireRole("CAPITAL_SEEKER"), deleteDocument);
r.get(
  "/access-logs/:startup_id",
  protect,
  requireRole("CAPITAL_SEEKER"),
  getAccessLogs,
);
r.patch("/:id/verify", protect, requireRole("ADMIN"), verifyDocument);
r.get("/admin/all", protect, requireRole("ADMIN"), getAllDocumentsForAdmin);
export default r;
