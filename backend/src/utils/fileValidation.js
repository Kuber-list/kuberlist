import { fileTypeFromFile } from "file-type";
import { createError } from "../middleware/errorHandler.js";

const allowedMime = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
];

const extMimeMap = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export async function validateUploadedFile(file) {
  if (!file) {
    throw createError(400, "No file uploaded");
  }

  const detectedType = await fileTypeFromFile(file.path);

  if (!detectedType || !allowedMime.includes(detectedType.mime)) {
    throw createError(400, "Invalid file type");
  }

  const uploadedExt = file.originalname
    .substring(file.originalname.lastIndexOf("."))
    .toLowerCase();

  if (
    extMimeMap[uploadedExt] &&
    extMimeMap[uploadedExt] !== detectedType.mime
  ) {
    throw createError(400, "File extension does not match actual file type");
  }

  return detectedType;
}
