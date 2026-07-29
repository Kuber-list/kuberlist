import prisma from "../utils/prisma.js";
import { fileTypeFromFile } from "file-type";
import fs from "fs/promises";
import cloudinary from "../config/cloudinary.js";
export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }
    const detected = await fileTypeFromFile(req.file.path);

    const allowed = ["image/jpeg", "image/png"];

    if (!detected || !allowed.includes(detected.mime)) {
      await fs.unlink(req.file.path).catch(() => {});

      return res.status(400).json({
        success: false,
        message: "Invalid image file",
      });
    }
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "kuberlist/profile-images",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png"],
    });

    await fs.unlink(req.file.path).catch(() => {});

    const user = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        profile_image_url: uploadResult.secure_url,
      },
    });

    res.json({
      success: true,
      data: {
        profile_image_url: user.profile_image_url,
      },
    });
  } catch (err) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(err);
  }
};
