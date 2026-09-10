import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";

import {
  initializeDueDiligence,
  getDueDiligenceByConnection,
  recalculateDueDiligence,
  updateRequirementStatus,
  attachDocumentToRequirement,
  verifyRequirement,
  getCategoryBreakdown,
  getDueDiligenceSummary,
} from "../services/dueDiligence.js";

/*
  ============================================================
  AUTHORIZATION HELPERS
  ============================================================
*/

/*
  Get the connection associated with a DD workspace.
*/
const getDueDiligenceConnection = async (dueDiligenceId) => {
  const dd = await prisma.dueDiligence.findUnique({
    where: {
      id: dueDiligenceId,
    },

    select: {
      id: true,

      connection: {
        select: {
          id: true,
          investor_id: true,
          seeker_id: true,
          status: true,
          listing_id: true,
        },
      },
    },
  });

  if (!dd) {
    throw createError(404, "Due diligence workspace not found");
  }

  return dd;
};

/*
  Participants and KuberList administrators can access DD.
*/
const authorizeDueDiligenceAccess = async (
  dueDiligenceId,
  userId,
  userRole,
) => {
  const dd = await getDueDiligenceConnection(dueDiligenceId);

  const connection = dd.connection;

  if (
    connection.investor_id !== userId &&
    connection.seeker_id !== userId &&
    userRole !== "ADMIN"
  ) {
    throw createError(403, "Access denied");
  }

  if (connection.status !== "ACTIVE") {
    throw createError(403, "This connection is not active");
  }

  return dd;
};

/*
  Requirement -> DD -> Connection authorization.

  Participants and KuberList administrators can access
  requirements.

  ADMIN is intentionally allowed here because KuberList
  administrators must be able to verify DD evidence.
*/
const authorizeRequirementAccess = async (requirementId, userId, userRole) => {
  const requirement = await prisma.dDRequirement.findUnique({
    where: {
      id: requirementId,
    },

    select: {
      id: true,

      due_diligence_id: true,

      due_diligence: {
        select: {
          connection: {
            select: {
              id: true,
              investor_id: true,
              seeker_id: true,
              status: true,
              listing_id: true,
            },
          },
        },
      },
    },
  });

  if (!requirement) {
    throw createError(404, "DD requirement not found");
  }

  const connection = requirement.due_diligence.connection;

  if (
    connection.investor_id !== userId &&
    connection.seeker_id !== userId &&
    userRole !== "ADMIN"
  ) {
    throw createError(403, "Access denied");
  }

  if (connection.status !== "ACTIVE") {
    throw createError(403, "This connection is not active");
  }

  return requirement;
};

/*
  ============================================================
  INITIALIZE DD
  ============================================================
*/

export const initialize = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const connection = await prisma.connection.findUnique({
      where: {
        id: connectionId,
      },

      select: {
        id: true,
        investor_id: true,
        seeker_id: true,
        status: true,
        listing_id: true,
        nda_required: true,
        nda_executed: true,
        nda_requirement_overridden: true,
      },
    });

    if (!connection) {
      throw createError(404, "Connection not found");
    }

    /*
      Only participants may initialize DD.
    */
    if (
      connection.investor_id !== req.user.id &&
      connection.seeker_id !== req.user.id
    ) {
      throw createError(403, "Access denied");
    }

    /*
      DD only starts on an active connection.
    */
    if (connection.status !== "ACTIVE") {
      throw createError(400, "Due diligence requires an active connection");
    }

    /*
      Preserve the existing NDA protection.
    */
    if (
      connection.nda_required &&
      !connection.nda_executed &&
      !connection.nda_requirement_overridden
    ) {
      throw createError(
        403,
        "An executed NDA or NDA override is required before starting due diligence",
      );
    }

    const dd = await initializeDueDiligence(connectionId);

    return res.json({
      success: true,
      data: dd,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  GET DD BY CONNECTION
  ============================================================
*/

export const getByConnection = async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const connection = await prisma.connection.findUnique({
      where: {
        id: connectionId,
      },

      select: {
        id: true,
        investor_id: true,
        seeker_id: true,
        status: true,
      },
    });

    if (!connection) {
      throw createError(404, "Connection not found");
    }

    if (
      connection.investor_id !== req.user.id &&
      connection.seeker_id !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      throw createError(403, "Access denied");
    }

    if (connection.status !== "ACTIVE") {
      throw createError(403, "This connection is not active");
    }

    const dd = await getDueDiligenceByConnection(connectionId);

    if (!dd) {
      throw createError(
        404,
        "Due diligence has not been initialized for this connection",
      );
    }

    return res.json({
      success: true,
      data: dd,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  GET DD BY ID
  ============================================================
*/

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    await authorizeDueDiligenceAccess(id, req.user.id, req.user.role);

    const dd = await prisma.dueDiligence.findUnique({
      where: {
        id,
      },

      include: {
        template: true,

        connection: {
          select: {
            id: true,
            listing_id: true,
            investor_id: true,
            seeker_id: true,
            status: true,
            deal_stage: true,
            nda_required: true,
            nda_executed: true,
            nda_requirement_overridden: true,
          },
        },

        requirements: {
          include: {
            checklist_item: true,

            document: {
              select: {
                id: true,
                file_name: true,
                original_file_name: true,
                mime_type: true,
                file_size: true,
                document_type: true,
                visibility: true,
                verification_status: true,
                verified_by: true,
                verified_at: true,
                verification_notes: true,
                uploaded_at: true,
              },
            },

            diligence_request: true,
          },

          orderBy: {
            created_at: "asc",
          },
        },
      },
    });

    return res.json({
      success: true,
      data: dd,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  SUMMARY
  ============================================================
*/

export const summary = async (req, res, next) => {
  try {
    const { id } = req.params;

    await authorizeDueDiligenceAccess(id, req.user.id, req.user.role);

    const data = await getDueDiligenceSummary(id);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  CATEGORY BREAKDOWN
  ============================================================
*/

export const categories = async (req, res, next) => {
  try {
    const { id } = req.params;

    await authorizeDueDiligenceAccess(id, req.user.id, req.user.role);

    const data = await getCategoryBreakdown(id);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  RECALCULATE
  ============================================================
*/

export const recalculate = async (req, res, next) => {
  try {
    const { id } = req.params;

    await authorizeDueDiligenceAccess(id, req.user.id, req.user.role);

    const dd = await recalculateDueDiligence(id);

    return res.json({
      success: true,
      data: dd,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  UPDATE REQUIREMENT STATUS
  ============================================================
*/

export const updateStatus = async (req, res, next) => {
  try {
    const { requirementId } = req.params;

    const { status, notes } = req.body;

    const requirement = await authorizeRequirementAccess(
      requirementId,
      req.user.id,
      req.user.role,
    );

    if (!status) {
      throw createError(400, "status is required");
    }

    const dd = await updateRequirementStatus(requirementId, status, notes);

    return res.json({
      success: true,
      data: dd,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  ATTACH DOCUMENT
  ============================================================
*/

export const attachDocument = async (req, res, next) => {
  try {
    const { requirementId } = req.params;

    const { document_id } = req.body;

    const requirement = await authorizeRequirementAccess(
      requirementId,
      req.user.id,
      req.user.role,
    );

    if (!document_id) {
      throw createError(400, "document_id is required");
    }

    /*
      Only the company associated with the DD
      can attach its document as evidence.

      This prevents an investor from attaching arbitrary
      documents belonging to another company.
    */
    const connection = requirement.due_diligence.connection;

    if (connection.seeker_id !== req.user.id) {
      throw createError(403, "Only the company can attach DD evidence");
    }

    const result = await attachDocumentToRequirement(
      requirementId,
      document_id,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/*
  ============================================================
  VERIFY REQUIREMENT
  ============================================================
*/

export const verify = async (req, res, next) => {
  try {
    const { requirementId } = req.params;

    const { verification_level, verification_notes } = req.body;

    const requirement = await authorizeRequirementAccess(
      requirementId,
      req.user.id,
      req.user.role,
    );

    if (!verification_level) {
      throw createError(400, "verification_level is required");
    }

    /*
      Only KuberList staff/admin should be allowed
      to mark something KUBERLIST_VERIFIED.

      We deliberately do not trust a value supplied
      by the frontend.
    */
    if (verification_level === "KUBERLIST_VERIFIED") {
      if (req.user.role !== "ADMIN") {
        throw createError(
          403,
          "Only KuberList administrators can mark evidence as KuberList verified",
        );
      }
    }

    /*
      Third-party verification should not be something
      the company can self-award.
    */
    if (verification_level === "THIRD_PARTY_VERIFIED") {
      if (req.user.role !== "ADMIN") {
        throw createError(
          403,
          "Only authorized KuberList reviewers can confirm third-party verification",
        );
      }
    }

    const result = await verifyRequirement(
      requirementId,
      verification_level,
      req.user.id,
      verification_notes,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
