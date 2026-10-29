import cloudinary from "../../config/cloudinary.js";

class CloudinaryStorage {
  /**
   * Upload a document using the requested visibility.
   * PUBLIC documents use public delivery.
   * INTERESTED_ONLY documents use private delivery.
   */
  async upload(file, visibility = "INTERESTED_ONLY") {
    if (!file?.path) {
      throw new Error("Missing file path");
    }

    if (!["PUBLIC", "INTERESTED_ONLY"].includes(visibility)) {
      throw new Error("Invalid document visibility");
    }

    const isPrivate = visibility === "INTERESTED_ONLY";

    try {
      const options = {
        resource_type: "raw",
        type: isPrivate ? "private" : "upload",
        folder: "kuberlist/documents",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      };

      // Only public documents use public delivery.
      if (!isPrivate) {
        options.access_mode = "public";
      }

      const result = await cloudinary.uploader.upload(file.path, options);

      return {
        storage_provider: "CLOUDINARY",
        public_id: result.public_id,
        storage_path: isPrivate ? null : result.secure_url,
        original_file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        visibility,
      };
    } catch (err) {
      throw new Error(`Cloudinary upload failed: ${err.message}`);
    }
  }

  /**
   * Delete a Cloudinary document.
   */
  async delete(document) {
    if (!document?.public_id) return;

    try {
      await cloudinary.uploader.destroy(document.public_id, {
        resource_type: "raw",
        type: document.visibility === "INTERESTED_ONLY" ? "private" : "upload",
      });
    } catch (err) {
      throw new Error(`Cloudinary delete failed: ${err.message}`);
    }
  }

  /**
   * Generate a temporary URL for a private document.
   * Call only after the controller authorizes access.
   */
  getDownloadUrl(document, expiresInSeconds = 300) {
    if (!document?.public_id) {
      throw new Error("Missing Cloudinary public_id");
    }

    if (document.visibility === "INTERESTED_ONLY") {
      const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

      return cloudinary.utils.private_download_url(
        document.public_id,
        undefined,
        {
          resource_type: "raw",
          type: "private",
          expires_at: expiresAt,
          attachment: true,
        },
      );
    }

    if (document.storage_path) {
      return document.storage_path;
    }

    return cloudinary.url(document.public_id, {
      resource_type: "raw",
      type: "upload",
      secure: true,
    });
  }
}

export default new CloudinaryStorage();
