import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";

/*
  CREATE REQUEST
  Investor creates diligence request
*/

export const createRequest = async (req, res, next) => {
  try {
    const investor_id = req.user.id;

    const { title, request_type, notes } = req.body;

    const startup_id = req.interest.startup_id;

    if (!title || !request_type) {
      throw createError(400, "title and request_type are required");
    }

    const request = await prisma.diligenceRequest.create({
      data: {
        startup_id,
        investor_id,
        title,
        request_type,
        notes,
      },
    });

    return res.json({
      success: true,
      data: request,
    });
  } catch (err) {
    next(err);
  }
};

/*
  GET REQUESTS
*/

export const getRequests = async (req, res, next) => {
  try {
    const { startupId } = req.params;

    const startup = await prisma.startupListing.findUnique({
      where: {
        id: startupId,
      },
    });

    if (!startup) {
      throw createError(404, "Startup not found");
    }

    const isOwner = startup.capital_seeker_id === req.user.id;

    let whereClause = {
      startup_id: startupId,
    };

    // Investors can only see their own requests
    if (!isOwner && req.user.role === "INVESTOR") {
      whereClause.investor_id = req.user.id;
    }

    const requests = await prisma.diligenceRequest.findMany({
      where: whereClause,

      include: {
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        response_document: {
          select: {
            id: true,
            file_name: true,
            verification_status: true,
            verification_notes: true,
            verified_at: true,
            file_url: true,
          },
        },
      },

      orderBy: {
        requested_at: "desc",
      },
    });

    return res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

/*
  STARTUP RESPONDS
*/

export const respondToRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { document_id } = req.body;

    const request = await prisma.diligenceRequest.findUnique({
      where: { id },

      include: {
        startup: true,
      },
    });

    if (!request) {
      throw createError(404, "Request not found");
    }

    // Only the owner of the startup can respond
    if (request.startup.capital_seeker_id !== req.user.id) {
      throw createError(403, "Access denied");
    }
    const connection = await prisma.connection.findFirst({
      where: {
        listing_id: request.startup_id,
        investor_id: request.investor_id,
        status: "ACTIVE",
      },
    });

    if (!connection) {
      throw createError(404, "Connection not found");
    }
    if (
      connection.nda_required &&
      !connection.nda_executed &&
      !connection.nda_requirement_overridden
    ) {
      throw createError(
        403,
        "An executed NDA or an NDA override is required before sharing documents",
      );
    }
    if (!document_id) {
      throw createError(400, "document_id is required");
    }
    const document = await prisma.document.findFirst({
      where: {
        id: document_id,
        startup_id: request.startup_id,
      },
    });

    if (!document) {
      throw createError(404, "Document not found for this startup");
    }
    const updated = await prisma.diligenceRequest.update({
      where: { id },

      data: {
        response_document_id: document_id,
        status: "UPLOADED",
      },
    });
    await prisma.sharedDocument.upsert({
      where: {
        connection_id_document_id: {
          connection_id: connection.id,
          document_id,
        },
      },
      update: {},
      create: {
        connection_id: connection.id,
        document_id,
        shared_by: req.user.id,
      },
    });
    return res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/*
  INVESTOR COMPLETES
*/

export const completeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.diligenceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw createError(404, "Request not found");
    }

    // Only the investor who created the request can complete it
    if (request.investor_id !== req.user.id) {
      throw createError(403, "Access denied");
    }

    const updated = await prisma.diligenceRequest.update({
      where: { id },

      data: {
        status: "COMPLETED",
        completed_at: new Date(),
      },
    });

    return res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
