import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { validateConnectionAccess } from "../middleware/connection.js";
import {
  updateDealStage,
  getUserConnections,
  getConnection,
  getSharedDocuments,
  uploadNDA,
  overrideNDA,
} from "../controllers/connection.js";
import { upload } from "../middleware/upload.js";

const r = Router();

r.get("/user/:user_id", protect, getUserConnections);
r.get("/:id/documents", protect, validateConnectionAccess, getSharedDocuments);

r.get("/:id", protect, validateConnectionAccess, getConnection);

r.patch("/:id/stage", protect, validateConnectionAccess, updateDealStage);

r.post(
  "/:id/nda",
  protect,
  validateConnectionAccess,
  upload.single("file"),
  uploadNDA,
);

r.patch("/:id/nda/override", protect, validateConnectionAccess, overrideNDA);

export default r;
