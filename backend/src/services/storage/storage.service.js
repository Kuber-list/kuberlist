import fs from "fs/promises";
import cloudinaryStorage from "./cloudinaryStorage.js";

class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || "CLOUDINARY";
  }

  /**
   * Upload a file to the configured storage provider.
   */
  async upload(file, visibility = "INTERESTED_ONLY") {
    if (!file) throw new Error("No file provided for upload");

    try {
      return await cloudinaryStorage.upload(file, visibility);
    } finally {
      await this.deleteTempFile(file.path);
    }
  }

  /**
   * Delete a document from the configured storage provider.
   */
  async delete(document) {
    return cloudinaryStorage.delete(document);
  }

  /**
   * Get a secure download URL.
   */
  getDownloadUrl(document) {
    return cloudinaryStorage.getDownloadUrl(document);
  }

  /**
   * Delete a temporary local upload created by multer.
   */
  async deleteTempFile(filePath) {
    if (!filePath) return;

    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Ignore if the file has already been removed
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }
}

export default new StorageService();
