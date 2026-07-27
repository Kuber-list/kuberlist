import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import storageService from "../services/storage/storage.service.js";
//import path from "path";
//import fs from "fs";
import { fileTypeFromFile } from "file-type";
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, "No file uploaded");
    }

    const detectedType = await fileTypeFromFile(req.file.path);

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

    if (!detectedType || !allowedMime.includes(detectedType.mime)) {
      await storageService.deleteTempFile(req.file.path);

      throw createError(400, "Invalid file type");
    }

    const uploadedExt = req.file.originalname
      .substring(req.file.originalname.lastIndexOf("."))
      .toLowerCase();

    const extMimeMap = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    if (
      extMimeMap[uploadedExt] &&
      extMimeMap[uploadedExt] !== detectedType.mime
    ) {
      await storageService.deleteTempFile(req.file.path);

      throw createError(400, "File extension does not match actual file type");
    }

    const { startup_id, document_type, visibility } = req.body;
    const allowedVisibility = ["PUBLIC", "INTERESTED_ONLY"];

    if (visibility && !allowedVisibility.includes(visibility)) {
      throw createError(400, "Invalid visibility");
    }
    const allowedDocumentTypes = [
      "PITCH_DECK",
      "FINANCIAL_MODEL",
      "BUSINESS_PLAN",
      "TERM_SHEET",
      "CAP_TABLE",
      "GOVERNMENT_CONTRACT",
      "PURCHASE_ORDER",
      "REVENUE_PROOF",
      "CUSTOMER_CONTRACT",
      "PATENT_CERTIFICATE",
      "ACCELERATOR_CERTIFICATE",
      "STARTUP_INDIA_CERTIFICATE",
      "NDA",
      "OTHER",
      "DILIGENCE_REQUEST",
    ];

    if (document_type && !allowedDocumentTypes.includes(document_type)) {
      throw createError(400, "Invalid document type");
    }
    if (!startup_id) {
      throw createError(400, "startup_id required");
    }

    const listing = await prisma.startupListing.findFirst({
      where: {
        id: startup_id,
        capital_seeker_id: req.user.id,
      },
    });

    if (!listing) {
      throw createError(404, "Listing not found");
    }

    const uploaded = await storageService.upload(req.file);

    const doc = await prisma.document.create({
      data: {
        startup_id,

        file_name: req.file.originalname,

        file_url: uploaded.storage_path,

        storage_provider: uploaded.storage_provider,

        public_id: uploaded.public_id,

        storage_path: uploaded.storage_path,

        mime_type: uploaded.mime_type,

        original_file_name: uploaded.original_file_name,

        file_size: uploaded.file_size,

        document_type,

        visibility,

        verification_status: "UPLOADED",
      },
    });

    res.status(201).json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const { startupId } = req.params;

    const listing = await prisma.startupListing.findUnique({
      where: {
        id: startupId,
      },
    });

    if (!listing) {
      throw createError(404, "Listing not found");
    }

    const isOwner = listing.capital_seeker_id === req.user?.id;

    // Owner sees all docs
    if (isOwner) {
      const docs = await prisma.document.findMany({
        where: {
          startup_id: startupId,
        },

        orderBy: {
          uploaded_at: "desc",
        },
      });

      return res.json({
        success: true,
        data: docs,
      });
    }

    // Investors
    let hasAcceptedInterest = false;
    let interestStatus = null;

    if (req.user?.role === "INVESTOR") {
      const interest = await prisma.interest.findUnique({
        where: {
          investor_id_startup_id: {
            investor_id: req.user.id,
            startup_id: startupId,
          },
        },
      });

      hasAcceptedInterest = interest?.status === "ACCEPTED";

      interestStatus = interest?.status || null;
    }

    // Public docs only unless accepted
    const docs = await prisma.document.findMany({
      where: {
        startup_id: startupId,

        ...(!hasAcceptedInterest && {
          visibility: "PUBLIC",
        }),
      },

      orderBy: {
        uploaded_at: "desc",
      },
    });

    // Log access for private docs
    if (
      req.user?.role === "INVESTOR" &&
      hasAcceptedInterest &&
      docs.length > 0
    ) {
      const privateDocs = docs.filter(
        (d) => d.visibility === "INTERESTED_ONLY",
      );

      if (privateDocs.length > 0) {
        Promise.all(
          privateDocs.map((d) =>
            prisma.documentAccessLog.create({
              data: {
                document_id: d.id,
                investor_id: req.user.id,
                startup_id: startupId,
                viewed_at: new Date(),
              },
            }),
          ),
        ).catch(() => {});
      }
    }

    res.json({
      success: true,

      data: docs,

      interest_status: interestStatus,

      requires_interest: !hasAcceptedInterest,
    });
  } catch (err) {
    next(err);
  }
};
export const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: {
        id,
      },
      include: {
        startup: true,
      },
    });

    if (!document) {
      throw createError(404, "Document not found");
    }

    // Admin can download anything
    if (req.user.role === "ADMIN") {
      const url = storageService.getDownloadUrl(document);

      return res.json({
        success: true,
        download_url: url,
      });
    }

    // Startup owner can download all their documents
    if (document.startup.capital_seeker_id === req.user.id) {
      const url = storageService.getDownloadUrl(document);

      return res.json({
        success: true,
        download_url: url,
      });
    }

    // Investors
    if (req.user.role === "INVESTOR") {
      // Public document
      if (document.visibility === "PUBLIC") {
        const url = storageService.getDownloadUrl(document);
        return res.redirect(url);
      }

      // Private document requires accepted interest
      const interest = await prisma.interest.findUnique({
        where: {
          investor_id_startup_id: {
            investor_id: req.user.id,
            startup_id: document.startup_id,
          },
        },
      });

      if (interest?.status !== "ACCEPTED") {
        throw createError(
          403,
          "You do not have permission to access this document",
        );
      }

      await prisma.documentAccessLog.create({
        data: {
          document_id: document.id,
          investor_id: req.user.id,
          startup_id: document.startup_id,
          viewed_at: new Date(),
        },
      });

      const url = storageService.getDownloadUrl(document);

      return res.json({
        success: true,
        download_url: url,
      });
    }

    throw createError(403, "Access denied");
  } catch (err) {
    next(err);
  }
};
export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({
      where: {
        id: req.params.id,
      },

      include: {
        startup: true,
      },
    });

    if (!doc) {
      throw createError(404, "Document not found");
    }

    if (doc.startup.capital_seeker_id !== req.user.id) {
      throw createError(403, "Not authorised");
    }

    await storageService.delete(doc);

    await prisma.document.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      message: "Document deleted",
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET ACCESS LOGS
// ─────────────────────────────────────────────

export const getAccessLogs = async (req, res, next) => {
  try {
    const { startup_id } = req.params;

    const listing = await prisma.startupListing.findFirst({
      where: {
        id: startup_id,
        capital_seeker_id: req.user.id,
      },
    });

    if (!listing) {
      throw createError(404, "Listing not found or access denied");
    }

    const logs = await prisma.documentAccessLog.findMany({
      where: {
        startup_id,
      },

      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,

            investorProfile: {
              select: {
                investor_category: true,
                fund_name: true,
              },
            },
          },
        },
      },

      orderBy: {
        viewed_at: "desc",
      },
    });

    const docIds = [...new Set(logs.map((l) => l.document_id))];

    const docs = await prisma.document.findMany({
      where: {
        id: {
          in: docIds,
        },
      },

      select: {
        id: true,
        file_name: true,
        document_type: true,
      },
    });

    const docMap = Object.fromEntries(docs.map((d) => [d.id, d]));

    const enriched = logs.map((l) => ({
      id: l.id,

      document_name: docMap[l.document_id]?.file_name || "Unknown",

      document_type: docMap[l.document_id]?.document_type || "OTHER",

      investor_name: l.investor.name,

      investor_email: l.investor.email,

      investor_category: l.investor.investorProfile?.investor_category,

      fund_name: l.investor.investorProfile?.fund_name,

      viewed_at: l.viewed_at,
    }));

    res.json({
      success: true,
      data: enriched,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// VERIFY DOCUMENT
// ─────────────────────────────────────────────

export const verifyDocument = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const allowed = ["UPLOADED", "THIRD_PARTY_VERIFIED", "KUBERLIST_REVIEWED"];

    if (!allowed.includes(status)) {
      throw createError(400, "Invalid verification status");
    }

    const existingDoc = await prisma.document.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingDoc) {
      throw createError(404, "Document not found");
    }

    const updated = await prisma.document.update({
      where: {
        id: req.params.id,
      },

      data: {
        verification_status: status,

        verification_notes: notes || "",

        verified_by: req.user.id,

        verified_at: new Date(),
      },
    });

    res.json({
      success: true,

      message: "Document verification updated",

      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// ADMIN — GET ALL DOCUMENTS
// ─────────────────────────────────────────────

export const getAllDocumentsForAdmin = async (req, res, next) => {
  try {
    const docs = await prisma.document.findMany({
      include: {
        startup: {
          include: {
            capital_seeker: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },

      orderBy: {
        uploaded_at: "desc",
      },
    });

    const transformed = docs.map((d) => ({
      id: d.id,

      file_name: d.file_name,

      storage_provider: d.storage_provider,

      mime_type: d.mime_type,

      original_file_name: d.original_file_name,

      file_size: d.file_size,

      document_type: d.document_type,

      visibility: d.visibility,

      verification_status: d.verification_status,

      verification_notes: d.verification_notes,

      verified_at: d.verified_at,

      uploaded_at: d.uploaded_at,

      startup: {
        id: d.startup?.id,

        name: d.startup?.name || "Unknown Startup",
      },

      founder: {
        id: d.startup?.capital_seeker?.id,

        name: d.startup?.capital_seeker?.name || "Unknown Founder",

        email: d.startup?.capital_seeker?.email || "",
      },
    }));

    res.json({
      success: true,

      data: transformed,
    });
  } catch (err) {
    next(err);
  }
};
