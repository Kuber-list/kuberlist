import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import storageService from "../services/storage/storage.service.js";
/**
 * GET /api/secondary-deals/my
 * Get all secondary deals for the logged-in seller or buyer
 */
export const getMySecondaryDeals = async (req, res, next) => {
  try {
    const deals = await prisma.secondaryDeal.findMany({
      where: {
        OR: [
          {
            seller_id: req.user.id,
          },
          {
            buyer_id: req.user.id,
          },
        ],
      },
      include: {
        secondary_interest: {
          include: {
            opportunity: {
              include: {
                listing: {
                  select: {
                    id: true,
                    name: true,
                    sector: true,
                  },
                },
                external_organization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json({
      success: true,
      current_user_id: req.user.id,
      data: deals,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/secondary-deals/:id
 * Get one secondary deal
 */
export const getSecondaryDeal = async (req, res, next) => {
  try {
    const deal = await prisma.secondaryDeal.findFirst({
      where: {
        id: req.params.id,
        OR: [
          {
            seller_id: req.user.id,
          },
          {
            buyer_id: req.user.id,
          },
        ],
      },
      include: {
        secondary_interest: {
          include: {
            opportunity: {
              include: {
                listing: {
                  select: {
                    id: true,
                    name: true,
                    sector: true,
                  },
                },
                external_organization: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!deal) {
      throw createError(404, "Secondary deal not found");
    }

    res.json({
      success: true,
      current_user_id: req.user.id,
      data: deal,
    });
  } catch (err) {
    next(err);
  }
};
/**
 * GET /api/secondary-deals/:id/messages
 * Get messages for a secondary deal
 */
export const getSecondaryDealMessages = async (req, res, next) => {
  try {
    const deal = await prisma.secondaryDeal.findFirst({
      where: {
        id: req.params.id,
        OR: [{ seller_id: req.user.id }, { buyer_id: req.user.id }],
      },
    });

    if (!deal) {
      throw createError(404, "Secondary deal not found");
    }

    const messages = await prisma.secondaryMessage.findMany({
      where: {
        deal_id: deal.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-deals/:id/messages
 * Send a message in a secondary deal
 */
export const sendSecondaryDealMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      throw createError(400, "Message is required");
    }

    const deal = await prisma.secondaryDeal.findFirst({
      where: {
        id: req.params.id,
        OR: [{ seller_id: req.user.id }, { buyer_id: req.user.id }],
      },
    });

    if (!deal) {
      throw createError(404, "Secondary deal not found");
    }

    const newMessage = await prisma.secondaryMessage.create({
      data: {
        deal_id: deal.id,
        sender_id: req.user.id,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (err) {
    next(err);
  }
};
/**
 * PATCH /api/secondary-deals/:id/status
 * Update the status of a secondary deal
 */
export const updateSecondaryDealStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "IN_DISCUSSION",
      "NEGOTIATING",
      "AGREED",
      "COMPLETED",
      "FAILED",
      "WITHDRAWN",
    ];

    if (!allowedStatuses.includes(status)) {
      throw createError(400, "Invalid secondary deal status");
    }

    const deal = await prisma.secondaryDeal.findFirst({
      where: {
        id: req.params.id,
        OR: [{ seller_id: req.user.id }, { buyer_id: req.user.id }],
      },
    });

    if (!deal) {
      throw createError(404, "Secondary deal not found");
    }

    const updateData = {
      status,
    };

    if (status === "COMPLETED") {
      updateData.completed_at = new Date();
    }

    const updatedDeal = await prisma.secondaryDeal.update({
      where: {
        id: deal.id,
      },
      data: updateData,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedDeal,
      message: "Secondary deal status updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/secondary-deals/:id/documents
 * Get all documents shared in a secondary deal
 */
export const getSecondaryDealDocuments = async (req, res, next) => {
  try {
    const deal = await prisma.secondaryDeal.findFirst({
      where: {
        id: req.params.id,
        OR: [{ seller_id: req.user.id }, { buyer_id: req.user.id }],
      },
    });

    if (!deal) {
      throw createError(404, "Secondary deal not found");
    }

    const documents = await prisma.secondaryDealDocument.findMany({
      where: {
        deal_id: deal.id,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        uploaded_at: "desc",
      },
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-deals/:id/document-requests
 * Request a document from the other party
 */
export const requestSecondaryDealDocument = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (!title?.trim()) {
      throw createError(400, "Document title is required");
    }

    const deal = await prisma.secondaryDeal.findFirst({
      where: {
        id: req.params.id,
        OR: [{ seller_id: req.user.id }, { buyer_id: req.user.id }],
      },
    });

    if (!deal) {
      throw createError(404, "Secondary deal not found");
    }

    const requestedFrom =
      deal.seller_id === req.user.id ? deal.buyer_id : deal.seller_id;

    const documentRequest = await prisma.secondaryDealDocumentRequest.create({
      data: {
        deal_id: deal.id,
        requested_by: req.user.id,
        requested_from: requestedFrom,
        title: title.trim(),
        description: description?.trim() || null,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
          },
        },
        requested_from_user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: documentRequest,
      message: "Document request created successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/secondary-deals/:id/document-requests
 * Get all document requests for a secondary deal
 */
export const getSecondaryDealDocumentRequests = async (req, res, next) => {
  try {
    const deal = await prisma.secondaryDeal.findFirst({
      where: {
        id: req.params.id,
        OR: [{ seller_id: req.user.id }, { buyer_id: req.user.id }],
      },
    });

    if (!deal) {
      throw createError(404, "Secondary deal not found");
    }

    const requests = await prisma.secondaryDealDocumentRequest.findMany({
      where: {
        deal_id: deal.id,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
          },
        },
        requested_from_user: {
          select: {
            id: true,
            name: true,
          },
        },
        document: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/secondary-deals/:id/document-requests/:requestId
 * Attach a document to a document request
 */
/**
 * PATCH /api/secondary-deals/:id/document-requests/:requestId
 * Upload and attach a document to a document request
 */
export const fulfillSecondaryDealDocumentRequest = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, "No file uploaded");
    }

    const deal = await prisma.secondaryDeal.findFirst({
      where: {
        id: req.params.id,
        OR: [{ seller_id: req.user.id }, { buyer_id: req.user.id }],
      },
    });

    if (!deal) {
      throw createError(404, "Secondary deal not found");
    }

    const documentRequest = await prisma.secondaryDealDocumentRequest.findFirst(
      {
        where: {
          id: req.params.requestId,
          deal_id: deal.id,
        },
      },
    );

    if (!documentRequest) {
      throw createError(404, "Document request not found");
    }

    if (documentRequest.requested_from !== req.user.id) {
      throw createError(
        403,
        "Only the requested user can fulfill this document request",
      );
    }

    if (documentRequest.status !== "REQUESTED") {
      throw createError(
        400,
        "This document request has already been fulfilled",
      );
    }

    // Upload the file using the same storage system as normal
    // secondary deal documents.
    const uploaded = await storageService.upload(req.file);

    // Create the secondary deal document.
    const document = await prisma.secondaryDealDocument.create({
      data: {
        deal_id: deal.id,
        uploaded_by: req.user.id,

        file_name: req.file.originalname,

        file_url: uploaded.storage_path,

        storage_provider: uploaded.storage_provider,

        public_id: uploaded.public_id,

        storage_path: uploaded.storage_path,

        mime_type: uploaded.mime_type,

        original_file_name: uploaded.original_file_name,

        file_size: uploaded.file_size,
      },

      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Attach the uploaded document to the request.
    const updatedRequest = await prisma.secondaryDealDocumentRequest.update({
      where: {
        id: documentRequest.id,
      },

      data: {
        document_id: document.id,
        status: "FULFILLED",
      },

      include: {
        requester: {
          select: {
            id: true,
            name: true,
          },
        },

        requested_from_user: {
          select: {
            id: true,
            name: true,
          },
        },

        document: {
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      document,
      message: "Document request fulfilled successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-deals/:id/documents
 * Create a document record for a secondary deal
 */
export const createSecondaryDealDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, "No file uploaded");
    }

    const deal = await prisma.secondaryDeal.findFirst({
      where: {
        id: req.params.id,
        OR: [{ seller_id: req.user.id }, { buyer_id: req.user.id }],
      },
    });

    if (!deal) {
      throw createError(404, "Secondary deal not found");
    }

    const uploaded = await storageService.upload(req.file);

    const document = await prisma.secondaryDealDocument.create({
      data: {
        deal_id: deal.id,

        uploaded_by: req.user.id,

        file_name: req.file.originalname,

        file_url: uploaded.storage_path,

        storage_provider: uploaded.storage_provider,

        public_id: uploaded.public_id,

        storage_path: uploaded.storage_path,

        mime_type: uploaded.mime_type,

        original_file_name: uploaded.original_file_name,

        file_size: uploaded.file_size,
      },

      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (err) {
    next(err);
  }
};
