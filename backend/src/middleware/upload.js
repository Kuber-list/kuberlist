import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import fs from "fs";

const uploadDir = process.env.UPLOAD_DIR || "src/uploads";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExt = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
  ];

  const allowedMime = [
    "application/pdf",

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-excel",

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "application/vnd.ms-powerpoint",

    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    "image/png",

    "image/jpeg",
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExt.includes(ext) || !allowedMime.includes(file.mimetype)) {
    return cb(
      new Error(
        "Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, PNG and JPG files are allowed",
      ),
      false,
    );
  }

  cb(null, true);
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || "25") * 1024 * 1024;

export const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: maxSize,
  },
});
