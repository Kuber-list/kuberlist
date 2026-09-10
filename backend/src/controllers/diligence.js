import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import { attachDocumentToRequirement } from "../services/dueDiligence.js";

/*
  ============================================================
  CREATE REQUEST
  Investor creates diligence request
  ============================================================

  requirement_id is OPTIONAL.

  If requirement_id is supplied:
    The investor request is linked to an existing DD requirement.

  If requirement_id is omitted:
    This remains a normal investor-specific request.
*/

export const createRequest = async (req, res, next) => {
  try {
    const investor_id = req.user.id;

    const { title, request_type, notes, requirement_id } = req.body;

    const startup_id = req.interest.startup_id;

    if (!title || !request_type) {
      throw createError(400, "title and request_type are required");
    }

    let requirement = null;

    /*
      ----------------------------------------------------------
      Optional DD requirement validation
      ----------------------------------------------------------
    */
    if (requirement_id) {
      requirement = await prisma.dDRequirement.findUnique({
        where: {
          id: requirement_id,
        },

        include: {
          due_diligence: {
            select: {
              id: true,

              connection: {
                select: {
                  listing_id: true,
                  investor_id: true,
                  seeker_id: true,
                  status: true,
                },
              },
            },
          },

          diligence_request: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!requirement) {
        throw createError(404, "DD requirement not found");
      }

      const connection = requirement.due_diligence.connection;

      /*
        Requirement must belong to the startup being requested.
      */
      if (connection.listing_id !== startup_id) {
        throw createError(
          400,
          "DD requirement does not belong to this startup",
        );
      }

      /*
        Requirement must belong to this investor's connection.
      */
      if (connection.investor_id !== investor_id) {
        throw createError(
          403,
          "This DD requirement does not belong to your connection",
        );
      }

      if (connection.status !== "ACTIVE") {
        throw createError(
          400,
          "DD requirement can only be requested on an active connection",
        );
      }

      /*
        Prevent multiple active requests against the same
        DD requirement.

        A completed request may be followed by another request.
      */
      if (
        requirement.diligence_request &&
        requirement.diligence_request.status !== "COMPLETED"
      ) {
        throw createError(
          400,
          "This DD requirement already has an active document request",
        );
      }
    }

    /*
      ----------------------------------------------------------
      Create the request
      ----------------------------------------------------------
    */
    const request = await prisma.diligenceRequest.create({
      data: {
        startup_id,
        investor_id,
        title,
        request_type,
        notes,
      },
    });

    /*
      ----------------------------------------------------------
      Link to DD requirement only when explicitly supplied.
      ----------------------------------------------------------
    */
    if (requirement) {
      await prisma.dDRequirement.update({
        where: {
          id: requirement.id,
        },

        data: {
          diligence_request_id: request.id,

          /*
            A missing requirement becomes requested.

            If it has already been addressed, don't downgrade it.
          */
          status:
            requirement.status === "MISSING" ||
            requirement.status === "REQUESTED"
              ? "REQUESTED"
              : requirement.status,
        },
      });
    }

    /*
      Return the request with the optional DD relationship.
    */
    const createdRequest = await prisma.diligenceRequest.findUnique({
      where: {
        id: request.id,
      },

      include: {
        dd_requirement: {
          include: {
            checklist_item: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: createdRequest,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  GET REQUESTS
  ============================================================
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

    /*
      Investors can only see their own requests.
    */
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
            original_file_name: true,
            verification_status: true,
            verification_notes: true,
            verified_at: true,
            file_url: true,
            uploaded_at: true,
          },
        },

        /*
          If this is a DD-linked request, return the DD
          requirement.

          Custom investor requests will have null here.
        */
        dd_requirement: {
          include: {
            checklist_item: true,
            document: {
              select: {
                id: true,
                file_name: true,
                original_file_name: true,
                verification_status: true,
                verification_notes: true,
                verified_at: true,
                file_url: true,
                uploaded_at: true,
              },
            },
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
  ============================================================
  STARTUP RESPONDS
  ============================================================
*/

export const respondToRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { document_id } = req.body;

    const request = await prisma.diligenceRequest.findUnique({
      where: {
        id,
      },

      include: {
        startup: true,

        /*
          Optional DD relationship.

          null = custom investor request
          object = DD-linked request
        */
        dd_requirement: true,
      },
    });

    if (!request) {
      throw createError(404, "Request not found");
    }

    /*
      Only the owner of the startup can respond.
    */
    if (request.startup.capital_seeker_id !== req.user.id) {
      throw createError(403, "Access denied");
    }

    /*
      Find the active investor/company connection.
    */
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

    /*
      Preserve existing NDA protection.
    */
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

    /*
      Document must belong to the startup.
    */
    const document = await prisma.document.findFirst({
      where: {
        id: document_id,
        startup_id: request.startup_id,
      },
    });

    if (!document) {
      throw createError(404, "Document not found for this startup");
    }

    /*
      ----------------------------------------------------------
      DD-LINKED REQUEST
      ----------------------------------------------------------

      If this request is linked to a DD requirement, use the
      authoritative DD evidence operation.

      This will:
        - attach document to DDRequirement
        - set DD status to UPLOADED / VERIFIED
        - set verification level
        - recalculate DD scores
    */
    if (request.dd_requirement) {
      await attachDocumentToRequirement(request.dd_requirement.id, document_id);
    }

    /*
      ----------------------------------------------------------
      Update the investor request
      ----------------------------------------------------------
    */
    const updated = await prisma.diligenceRequest.update({
      where: {
        id,
      },

      data: {
        response_document_id: document_id,
        status: "UPLOADED",
      },
    });

    /*
      ----------------------------------------------------------
      Share document with investor through the connection
      ----------------------------------------------------------
    */
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

    /*
      Return the complete updated request.
    */
    const responseData = await prisma.diligenceRequest.findUnique({
      where: {
        id: updated.id,
      },

      include: {
        response_document: {
          select: {
            id: true,
            file_name: true,
            original_file_name: true,
            verification_status: true,
            verification_notes: true,
            verified_at: true,
            file_url: true,
            uploaded_at: true,
          },
        },

        dd_requirement: {
          include: {
            checklist_item: true,

            document: {
              select: {
                id: true,
                file_name: true,
                original_file_name: true,
                verification_status: true,
                verification_notes: true,
                verified_at: true,
                file_url: true,
                uploaded_at: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  INVESTOR COMPLETES
  ============================================================
*/

export const completeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.diligenceRequest.findUnique({
      where: {
        id,
      },
    });

    if (!request) {
      throw createError(404, "Request not found");
    }

    /*
      Only the investor who created the request can complete it.
    */
    if (request.investor_id !== req.user.id) {
      throw createError(403, "Access denied");
    }

    const updated = await prisma.diligenceRequest.update({
      where: {
        id,
      },

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
