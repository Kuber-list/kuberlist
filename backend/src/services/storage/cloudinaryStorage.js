import cloudinary from "../../config/cloudinary.js";

class CloudinaryStorage {
  /**
   * Upload a document to Cloudinary
   */
  async upload(file) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "raw",
        type: "upload",
        access_mode: "public",
        folder: "kuberlist/documents",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      });

      return {
        storage_provider: "CLOUDINARY",

        public_id: result.public_id,

        storage_path: result.secure_url,

        original_file_name: file.originalname,

        mime_type: file.mimetype,

        file_size: file.size,
      };
    } catch (err) {
      throw new Error(`Cloudinary upload failed: ${err.message}`);
    }
  }

  /**
   * Delete uploaded document
   */
  async delete(document) {
    if (!document?.public_id) return;

    try {
      await cloudinary.uploader.destroy(document.public_id, {
        resource_type: "raw",
      });
    } catch (err) {
      throw new Error(`Cloudinary delete failed: ${err.message}`);
    }
  }

  /**
   * Generate secure download URL
   */
  getDownloadUrl(document) {
    if (!document?.public_id) {
      throw new Error("Missing Cloudinary public_id");
    }

    return cloudinary.url(document.public_id, {
      resource_type: "raw",

      secure: true,

      // sign_url: true,
    });
  }
}

export default new CloudinaryStorage();
