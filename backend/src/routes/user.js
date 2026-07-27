import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadProfileImage } from "../controllers/user.js";

const r = Router();

r.post("/profile-image", protect, upload.single("image"), uploadProfileImage);

export default r;
