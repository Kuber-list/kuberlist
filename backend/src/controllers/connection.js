import { notifyStageChanged } from "../services/notification.service.js";
import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import { SYSTEM_USER_ID } from "../constants/system.js";

const VALID_STAGES = [
  "ACCEPTED",
  "INTRO_CALL",
  "MEETING",
  "DUE_DILIGENCE",
  "TERM_SHEET",
  "CLOSED",
  "DROPPED",
];

// ── Internal: create connection when interest is accepted ─────────
export const createConnectionFromInterest = async (interest) => {
  // Prevent duplicate connections
  const existing = await prisma.connection.findUnique({
    where: { interest_id: interest.id },
  });
  if (existing) return existing;

  // Get listing to find seeker_id
  const listing = await prisma.startupListing.findUnique({
    where: { id: interest.startup_id },
    select: {
      id: true,
      name: true,
      capital_seeker_id: true,
      requires_nda: true,
    },
  });
  if (!listing) throw new Error("Listing not found");

  const connection = await prisma.connection.create({
    data: {
      listing_id: interest.startup_id,
      investor_id: interest.investor_id,
      seeker_id: listing.capital_seeker_id,
      interest_id: interest.id,
      status: "ACTIVE",
      deal_stage: "ACCEPTED",

      nda_required: listing.requires_nda,
    },
  });

  // Create system message: deal started
  prisma.message
    .create({
      data: {
        connection_id: connection.id,
        sender_id: SYSTEM_USER_ID,
        message: `Deal started — ${listing.name} connected with investor`,
        is_system: true,
        message_type: "SYSTEM",
        metadata: { event: "CONNECTION_CREATED" },
        read_by: [],
      },
    })
    .catch((err) => {
      console.error("Failed to create connection system message:", err);
    });

  return connection;
};

// ── PATCH /connections/:id/stage ──────────────────────────────────
export const updateDealStage = async (req, res, next) => {
  try {
    const {
      deal_stage,
      outcome,
      deal_amount,
      round_type,
      lead_investor_name,
      outcome_notes,
    } = req.body;
    if (!deal_stage) throw createError(400, "deal_stage is required");
    if (!VALID_STAGES.includes(deal_stage)) {
      throw createError(
        400,
        `Invalid deal_stage. Must be one of: ${VALID_STAGES.join(", ")}`,
      );
    }

    const connection = req.connection; // attached by validateConnectionAccess middleware

    // Prevent moving backwards from CLOSED/DROPPED
    if (
      ["CLOSED", "DROPPED"].includes(connection.deal_stage) &&
      deal_stage !== connection.deal_stage
    ) {
      throw createError(
        400,
        `Cannot update a ${connection.deal_stage} connection`,
      );
    }

    const updated = await prisma.connection.update({
      where: { id: connection.id },
      data: {
        deal_stage,

        status: ["CLOSED", "DROPPED"].includes(deal_stage)
          ? "CLOSED"
          : "ACTIVE",

        ...(deal_stage === "CLOSED" && {
          outcome,

          deal_amount: deal_amount ? Number(deal_amount) : null,

          round_type,

          lead_investor_name,

          outcome_notes,

          closed_at: new Date(),
        }),
      },
      include: {
        listing: { select: { id: true, name: true, sector: true } },
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image_url: true,
            investorProfile: true,
          },
        },
        seeker: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image_url: true,
          },
        },
      },
    });

    // Notify both parties
    const otherId =
      req.user.id === connection.investor_id
        ? connection.seeker_id
        : connection.investor_id;
    notifyStageChanged(
      otherId,
      req.user.role,
      deal_stage,
      connection.listing.name,
      connection.id,
    ).catch((err) => {
      console.error(err);
    });

    // Create system message in deal room
    prisma.message
      .create({
        data: {
          connection_id: connection.id,
          sender_id: SYSTEM_USER_ID,
          message: `Deal stage moved to ${deal_stage.replace(/_/g, " ")} by ${req.user.name}`,
          is_system: true,
          message_type: "SYSTEM",
          metadata: {
            stage: deal_stage,
            changed_by: req.user.id,
            changed_by_name: req.user.name,
          },
          read_by: [req.user.id],
        },
      })
      .catch((err) => {
        console.error("Failed to create stage system message:", err);
      });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ── GET /connections/user/:user_id ────────────────────────────────
export const getUserConnections = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Security: users can only fetch their own connections
    if (req.params.user_id !== userId && req.user.role !== "ADMIN") {
      throw createError(403, "You can only view your own connections");
    }

    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ investor_id: userId }, { seeker_id: userId }],
      },
      include: {
        listing: {
          select: {
            id: true,
            name: true,
            sector: true,
            stage: true,
            funding_ask: true,
          },
        },
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image_url: true,
            investorProfile: {
              select: { investor_category: true, fund_name: true },
            },
          },
        },
        seeker: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image_url: true,
            capitalSeekerProfile: { select: { organisation_name: true } },
          },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updated_at: "desc" },
    });

    res.json({ success: true, data: connections });
  } catch (err) {
    next(err);
  }
};

// ── GET /connections/:id ──────────────────────────────────────────
export const getConnection = async (req, res, next) => {
  try {
    const connection = req.connection; // attached by middleware
    const full = await prisma.connection.findUnique({
      where: { id: connection.id },
      include: {
        listing: {
          select: {
            id: true,
            name: true,
            sector: true,
            stage: true,
            funding_ask: true,
            location_city: true,
          },
        },
        investor: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image_url: true,
            investorProfile: true,
          },
        },
        seeker: {
          select: {
            id: true,
            name: true,
            email: true,
            profile_image_url: true,
            capitalSeekerProfile: true,
          },
        },
        interest: { select: { id: true, message: true, created_at: true } },
        _count: { select: { messages: true } },
      },
    });
    res.json({ success: true, data: full });
  } catch (err) {
    next(err);
  }
};
export const getSharedDocuments = async (req, res, next) => {
  try {
    const docs = await prisma.sharedDocument.findMany({
      where: {
        connection_id: req.connection.id,
      },
      include: {
        document: true,
      },
      orderBy: {
        shared_at: "desc",
      },
    });

    res.json({
      success: true,
      data: docs,
    });
  } catch (err) {
    next(err);
  }
};
export const uploadNDA = async (req, res, next) => {
  try {
    const connection = req.connection;
    if (connection.nda_executed) {
      throw createError(400, "NDA already uploaded");
    }
    if (connection.seeker_id !== req.user.id) {
      throw createError(403, "Only the founder can upload an NDA");
    }

    if (!req.file) {
      throw createError(400, "Please upload an NDA");
    }

    const document = await prisma.document.create({
      data: {
        startup_id: connection.listing_id,
        file_name: req.file.originalname,
        file_url: `/uploads/${req.file.filename}`,
        file_size: req.file.size,
        document_type: "NDA",
        visibility: "INTERESTED_ONLY",
      },
    });

    const updated = await prisma.connection.update({
      where: { id: connection.id },
      data: {
        nda_executed: true,
        nda_executed_at: new Date(),
        nda_uploaded_by: req.user.id,
        nda_document_id: document.id,
      },
    });

    await prisma.message.create({
      data: {
        connection_id: connection.id,
        sender_id: SYSTEM_USER_ID,
        message:
          "An executed NDA has been uploaded. Additional document sharing is enabled.",
        is_system: true,
        message_type: "SYSTEM",
        read_by: [],
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
export const overrideNDA = async (req, res, next) => {
  try {
    const connection = req.connection;
    if (connection.nda_executed) {
      throw createError(400, "NDA already executed for this connection");
    }
    if (connection.nda_requirement_overridden) {
      throw createError(400, "NDA requirement already overridden");
    }
    if (connection.seeker_id !== req.user.id) {
      throw createError(403, "Only the founder can override NDA requirements");
    }

    const updated = await prisma.connection.update({
      where: { id: connection.id },
      data: {
        nda_requirement_overridden: true,
        nda_overridden_at: new Date(),
        nda_overridden_by: req.user.id,
      },
    });

    await prisma.message.create({
      data: {
        connection_id: connection.id,
        sender_id: SYSTEM_USER_ID,
        message:
          "Founder elected to share additional information without requiring an executed NDA.",
        is_system: true,
        message_type: "SYSTEM",
        read_by: [],
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
