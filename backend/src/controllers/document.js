import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import storageService from "../services/storage/storage.service.js";
//import path from "path";
//import fs from "fs";
import { validateUploadedFile } from "../utils/fileValidation.js";
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, "No file uploaded");
    }

    try {
      await validateUploadedFile(req.file);
    } catch (error) {
      await storageService.deleteTempFile(req.file.path);
      throw error;
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

    const documentVisibility = visibility || "INTERESTED_ONLY";
    const uploaded = await storageService.upload(req.file, documentVisibility);

    const doc = await prisma.document.create({
      data: {
        startup_id,

        file_name: req.file.originalname,

        file_url: uploaded.storage_path || `private:${uploaded.public_id}`,

        storage_provider: uploaded.storage_provider,

        public_id: uploaded.public_id,

        storage_path: uploaded.storage_path,

        mime_type: uploaded.mime_type,

        original_file_name: uploaded.original_file_name,

        file_size: uploaded.file_size,

        document_type,

        visibility: documentVisibility,
        verification_status: "UPLOADED",
      },
    });

    const { file_url, public_id, storage_path, ...safeDoc } = doc;

    res.status(201).json({
      success: true,
      data: safeDoc,
    });
  } catch (err) {
    next(err);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const { startupId } = req.params;

    const listing = await prisma.startupListing.findUnique({
      where: { id: startupId },
    });

    if (!listing) {
      throw createError(404, "Listing not found");
    }

    const isAdmin = req.user?.role === "ADMIN";
    const isOwner = listing.capital_seeker_id === req.user?.id;

    // Admin and startup owner can see all documents.
    if (isAdmin || isOwner) {
      const docs = await prisma.document.findMany({
        where: { startup_id: startupId },
        select: {
          id: true,
          startup_id: true,
          file_name: true,
          original_file_name: true,
          document_type: true,
          visibility: true,
          sharing_scope: true,
          verification_status: true,
          verification_notes: true,
          verified_at: true,
          uploaded_at: true,
          mime_type: true,
          file_size: true,
        },
        orderBy: { uploaded_at: "desc" },
      });

      return res.json({
        success: true,
        data: docs,
      });
    }

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

    // Investors without accepted interest see public documents only.
    // Accepted investors see general private documents too.
    // Standard DD and investor-request documents are excluded here;
    // those must be authorized through the investor's own DD workspace.
    const docs = await prisma.document.findMany({
      where: {
        startup_id: startupId,
        OR: [
          { visibility: "PUBLIC" },
          ...(hasAcceptedInterest
            ? [
                {
                  visibility: "INTERESTED_ONLY",
                  sharing_scope: "GENERAL",
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        startup_id: true,
        file_name: true,
        original_file_name: true,
        document_type: true,
        visibility: true,
        sharing_scope: true,
        uploaded_at: true,
        // Do not return file_url, public_id, or storage_path.
      },
      orderBy: { uploaded_at: "desc" },
    });

    // Log private-document listing access for accepted investors.
    if (req.user?.role === "INVESTOR" && hasAcceptedInterest) {
      const privateDocs = docs.filter(
        (document) => document.visibility === "INTERESTED_ONLY",
      );

      if (privateDocs.length > 0) {
        await prisma.documentAccessLog.createMany({
          data: privateDocs.map((document) => ({
            document_id: document.id,
            investor_id: req.user.id,
            startup_id: startupId,
            viewed_at: new Date(),
          })),
        });
      }
    }

    return res.json({
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
      where: { id },
      include: { startup: true },
    });

    if (!document) {
      throw createError(404, "Document not found");
    }

    // Admin can download any document.
    if (req.user.role === "ADMIN") {
      return res.json({
        success: true,
        download_url: storageService.getDownloadUrl(document),
      });
    }

    // Startup owner can download their documents.
    if (document.startup.capital_seeker_id === req.user.id) {
      return res.json({
        success: true,
        download_url: storageService.getDownloadUrl(document),
      });
    }

    if (req.user.role !== "INVESTOR") {
      throw createError(403, "Access denied");
    }

    // Public documents remain accessible to investors.
    if (document.visibility === "PUBLIC") {
      return res.json({
        success: true,
        download_url: storageService.getDownloadUrl(document),
      });
    }

    // All private documents require accepted interest first.
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

    // General private documents are available after accepted interest.
    if (document.sharing_scope === "GENERAL") {
      // Continue to the access log and signed download URL below.
    } else if (document.sharing_scope === "STANDARD_DD") {
      // The investor must have an active connection at the DD stage.
      const connection = await prisma.connection.findFirst({
        where: {
          investor_id: req.user.id,
          listing_id: document.startup_id,
          status: "ACTIVE",
          deal_stage: "DUE_DILIGENCE",
        },
        select: {
          id: true,
          due_diligence: {
            select: {
              id: true,
              requirements: {
                where: {
                  document_id: document.id,
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!connection) {
        throw createError(
          403,
          "You do not have permission to access standard DD evidence",
        );
      }

      // The evidence must be linked to this investor's own DD workspace.
      // Cross-investor reuse will be handled separately after we establish
      // a reliable way to identify equivalent checklist requirements.
      if (!connection.due_diligence?.requirements?.length) {
        throw createError(
          403,
          "This document is not linked to your due-diligence workspace",
        );
      }
    } else if (document.sharing_scope === "INVESTOR_REQUEST") {
      // Investor-request documents must be explicitly shared with
      // this investor's own connection.
      const connection = await prisma.connection.findFirst({
        where: {
          investor_id: req.user.id,
          listing_id: document.startup_id,
          status: "ACTIVE",
        },
        select: { id: true, deal_stage: true },
      });

      if (!connection || connection.deal_stage !== "DUE_DILIGENCE") {
        throw createError(
          403,
          "You do not have permission to access this requested document",
        );
      }

      const sharedDocument = await prisma.sharedDocument.findUnique({
        where: {
          connection_id_document_id: {
            connection_id: connection.id,
            document_id: document.id,
          },
        },
        select: { document_id: true },
      });

      if (!sharedDocument) {
        throw createError(403, "This document has not been shared with you");
      }

      const request = await prisma.diligenceRequest.findFirst({
        where: {
          startup_id: document.startup_id,
          investor_id: req.user.id,
          response_document_id: document.id,
          status: "UPLOADED",
        },
        select: { id: true },
      });

      if (!request) {
        throw createError(403, "This document is not assigned to your request");
      }
    } else {
      throw createError(403, "Unrecognized document sharing scope");
    }

    await prisma.documentAccessLog.create({
      data: {
        document_id: document.id,
        investor_id: req.user.id,
        startup_id: document.startup_id,
        viewed_at: new Date(),
      },
    });

    return res.json({
      success: true,
      download_url: storageService.getDownloadUrl(document),
    });
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET ACCESS LOGS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// VERIFY DOCUMENT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        verification_notes: status === "UPLOADED" ? "" : notes || "",
        verified_by: status === "UPLOADED" ? null : req.user.id,
        verified_at: status === "UPLOADED" ? null : new Date(),
      },

      select: {
        id: true,
        startup_id: true,
        file_name: true,
        original_file_name: true,
        document_type: true,
        visibility: true,
        sharing_scope: true,
        verification_status: true,
        verification_notes: true,
        verified_by: true,
        verified_at: true,
        uploaded_at: true,
        mime_type: true,
        file_size: true,
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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ADMIN â€” GET ALL DOCUMENTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
