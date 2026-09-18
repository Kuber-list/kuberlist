import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import { notifyPortfolioMessageReceived } from "../services/notification.service.js";

const getPortfolioInvestmentForUser = async (investmentId, user) => {
  const investment = await prisma.investment.findUnique({
    where: { id: investmentId },
    include: {
      listing: {
        select: {
          id: true,
          name: true,
          capital_seeker_id: true,
        },
      },
      external_organization: true,
    },
  });

  if (!investment) {
    throw createError(404, "Investment not found");
  }

  const isInvestor = investment.investor_id === user.id;
  const isCapitalSeeker = investment.listing?.capital_seeker_id === user.id;

  if (!isInvestor && !isCapitalSeeker) {
    throw createError(403, "You do not have access to this investment");
  }

  return {
    investment,
    isInvestor,
    isCapitalSeeker,
  };
};

const investmentInclude = {
  listing: {
    include: {
      capital_seeker: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  external_organization: true,
  connection: true,
};

const validateInvestmentInput = (body) => {
  const {
    invested_amount,
    invested_at,
    instrument,
    entry_valuation,
    ownership_percentage,
    status,
  } = body;

  if (
    invested_amount === undefined ||
    invested_amount === null ||
    Number(invested_amount) < 0
  ) {
    throw createError(400, "Valid invested amount is required");
  }

  if (!invested_at) {
    throw createError(400, "Investment date is required");
  }

  if (!instrument) {
    throw createError(400, "Investment instrument is required");
  }

  if (entry_valuation !== undefined && entry_valuation !== null) {
    if (Number(entry_valuation) < 0) {
      throw createError(400, "Entry valuation cannot be negative");
    }
  }

  if (ownership_percentage !== undefined && ownership_percentage !== null) {
    const ownership = Number(ownership_percentage);

    if (ownership < 0 || ownership > 100) {
      throw createError(400, "Ownership percentage must be between 0 and 100");
    }
  }

  if (status) {
    const allowedStatuses = ["ACTIVE", "EXITED", "WRITTEN_OFF"];

    if (!allowedStatuses.includes(status)) {
      throw createError(400, "Invalid investment status");
    }
  }
};

/**
 * GET /api/portfolio
 * Get all investments belonging to the logged-in investor
 */
export const getPortfolio = async (req, res, next) => {
  try {
    const investments = await prisma.investment.findMany({
      where: req.user.role === "CAPITAL_SEEKER"
        ? { listing: { capital_seeker_id: req.user.id } }
        : { investor_id: req.user.id },
      include: investmentInclude,
      orderBy: {
        invested_at: "desc",
      },
    });

    res.json({
      success: true,
      data: investments,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/portfolio/summary
 * Portfolio totals and counts
 */
export const getPortfolioSummary = async (req, res, next) => {
  try {
    const investments = await prisma.investment.findMany({
      where: req.user.role === "CAPITAL_SEEKER"
        ? { listing: { capital_seeker_id: req.user.id } }
        : { investor_id: req.user.id },
      select: {
        invested_amount: true,
        current_value_override: true,
        exit_value: true,
        status: true,
      },
    });

    const summary = investments.reduce(
      (acc, investment) => {
        const investedAmount = investment.invested_amount || 0;

        acc.total_invested += investedAmount;

        if (investment.status === "ACTIVE") {
          acc.active_investments += 1;
          acc.active_invested += investedAmount;

          acc.current_value +=
            investment.current_value_override ?? investedAmount;
        }

        if (investment.status === "EXITED") {
          acc.exited_investments += 1;

          acc.realized_value += investment.exit_value ?? investedAmount;
        }

        if (investment.status === "WRITTEN_OFF") {
          acc.written_off_investments += 1;
        }

        return acc;
      },
      {
        total_investments: investments.length,
        active_investments: 0,
        exited_investments: 0,
        written_off_investments: 0,
        total_invested: 0,
        active_invested: 0,
        current_value: 0,
        realized_value: 0,
      },
    );

    summary.unrealized_gain_loss =
      summary.current_value - summary.active_invested;

    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/portfolio/:id
 * Get one investment
 */
export const getInvestment = async (req, res, next) => {
  try {
    const investment = await prisma.investment.findFirst({
      where: {
        id: req.params.id,
        investor_id: req.user.id,
      },
      include: investmentInclude,
    });

    if (!investment) {
      throw createError(404, "Investment not found");
    }

    res.json({
      success: true,
      data: investment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/portfolio/:id/workspace
 * Get the complete post-investment workspace
 */
export const getPortfolioWorkspace = async (req, res, next) => {
  try {
    const { investment, isInvestor, isCapitalSeeker } =
      await getPortfolioInvestmentForUser(req.params.id, req.user);

    const listingId = investment.listing_id;

    const [milestones, portfolioDocuments, updates, messages] =
      await Promise.all([
        prisma.portfolioMilestone.findMany({
          where: {
            investment_id: investment.id,
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
            supporting_documents: {
              include: {
                document: true,
              },
            },
          },
          orderBy: [
            { status: "asc" },
            { target_date: "asc" },
            { created_at: "desc" },
          ],
        }),

        prisma.portfolioDocument.findMany({
          where: {
            investment_id: investment.id,
          },
          include: {
            document: true,
            addedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        }),

        listingId
          ? prisma.startupUpdate.findMany({
              where: {
                startup_id: listingId,
              },
              orderBy: {
                created_at: "desc",
              },
            })
          : [],

        prisma.portfolioMessage.findMany({
          where: {
            investment_id: investment.id,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            created_at: "asc",
          },
          take: 100,
        }),
      ]);

    res.json({
      success: true,
      data: {
        investment,
        milestones,
        documents: portfolioDocuments,
        updates,
        messages,
        access: {
          is_investor: isInvestor,
          is_capital_seeker: isCapitalSeeker,
          can_chat: Boolean(
            investment.listing_id && (isInvestor || isCapitalSeeker),
          ),
          can_manage_investment: isInvestor || isCapitalSeeker,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/portfolio/:id/milestones
 * Get milestones for an investment
 */

/**
 * GET /api/portfolio/:id/documents
 * Get documents referenced by an investment
 */
export const getPortfolioDocuments = async (req, res, next) => {
  try {
    const { investment } = await getPortfolioInvestmentForUser(
      req.params.id,
      req.user,
    );

    const documents = await prisma.portfolioDocument.findMany({
      where: {
        investment_id: investment.id,
      },
      include: {
        document: true,
        addedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
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
 * POST /api/portfolio/:id/documents
 * Reference an existing startup document in an investment
 */
export const addPortfolioDocument = async (req, res, next) => {
  try {
    const { investment } = await getPortfolioInvestmentForUser(
      req.params.id,
      req.user,
    );

    if (!investment.listing_id) {
      throw createError(
        400,
        "External investments do not support portfolio documents",
      );
    }

    const { document_id, category } = req.body;

    if (!document_id) {
      throw createError(400, "Document ID is required");
    }

    const document = await prisma.document.findUnique({
      where: {
        id: document_id,
      },
      select: {
        id: true,
        startup_id: true,
      },
    });

    if (!document) {
      throw createError(404, "Document not found");
    }

    if (document.startup_id !== investment.listing_id) {
      throw createError(
        403,
        "Document does not belong to this investment",
      );
    }

    const existingPortfolioDocument = await prisma.portfolioDocument.findUnique({
      where: {
        investment_id_document_id: {
          investment_id: investment.id,
          document_id: document.id,
        },
      },
    });

    if (existingPortfolioDocument) {
      throw createError(409, "Document is already added to this portfolio");
    }

    const portfolioDocument = await prisma.portfolioDocument.create({
      data: {
        investment_id: investment.id,
        document_id: document.id,
        added_by: req.user.id,
        category: category?.trim() || "GENERAL",
      },
      include: {
        document: true,
        addedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: portfolioDocument,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/portfolio/:id/documents/:documentId
 * Remove a document reference from an investment
 */
export const deletePortfolioDocument = async (req, res, next) => {
  try {
    const { investment } = await getPortfolioInvestmentForUser(
      req.params.id,
      req.user,
    );

    const portfolioDocument = await prisma.portfolioDocument.findFirst({
      where: {
        investment_id: investment.id,
        document_id: req.params.documentId,
      },
    });

    if (!portfolioDocument) {
      throw createError(404, "Portfolio document not found");
    }

    await prisma.portfolioDocument.delete({
      where: {
        id: portfolioDocument.id,
      },
    });

    res.json({
      success: true,
      message: "Portfolio document removed successfully",
    });
  } catch (err) {
    next(err);
  }
};
export const getPortfolioMilestones = async (req, res, next) => {
  try {
    const { investment } = await getPortfolioInvestmentForUser(
      req.params.id,
      req.user,
    );

    const milestones = await prisma.portfolioMilestone.findMany({
      where: {
        investment_id: investment.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        supporting_documents: {
          include: {
            document: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { target_date: "asc" },
        { created_at: "desc" },
      ],
    });

    res.json({
      success: true,
      data: milestones,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/portfolio/:id/milestones
 * Create a milestone for an investment
 */
export const createPortfolioMilestone = async (req, res, next) => {
  try {
    const { investment } = await getPortfolioInvestmentForUser(
      req.params.id,
      req.user,
    );

    const {
      title,
      description,
      target_date,
      priority,
      status,
      progress,
      completed_at,
    } = req.body;

    if (!title?.trim()) {
      throw createError(400, "Milestone title is required");
    }

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const allowedStatuses = [
      "NOT_STARTED",
      "IN_PROGRESS",
      "COMPLETED",
      "AT_RISK",
    ];

    if (priority && !allowedPriorities.includes(priority)) {
      throw createError(400, "Invalid milestone priority");
    }

    if (status && !allowedStatuses.includes(status)) {
      throw createError(400, "Invalid milestone status");
    }

    if (progress !== undefined && progress !== null) {
      const numericProgress = Number(progress);

      if (
        !Number.isInteger(numericProgress) ||
        numericProgress < 0 ||
        numericProgress > 100
      ) {
        throw createError(
          400,
          "Milestone progress must be an integer from 0 to 100",
        );
      }
    }

    const milestone = await prisma.portfolioMilestone.create({
      data: {
        investment_id: investment.id,
        title: title.trim(),
        description: description?.trim() || null,
        created_by: req.user.id,
        target_date: target_date ? new Date(target_date) : null,
        priority: priority || "MEDIUM",
        status: status || "NOT_STARTED",
        progress:
          progress !== undefined && progress !== null ? Number(progress) : 0,
        completed_at: completed_at ? new Date(completed_at) : null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        supporting_documents: {
          include: {
            document: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: milestone,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/portfolio/:id/milestones/:milestoneId
 * Update a milestone
 */
export const updatePortfolioMilestone = async (req, res, next) => {
  try {
    const { investment } = await getPortfolioInvestmentForUser(
      req.params.id,
      req.user,
    );

    const existingMilestone = await prisma.portfolioMilestone.findFirst({
      where: {
        id: req.params.milestoneId,
        investment_id: investment.id,
      },
    });

    if (!existingMilestone) {
      throw createError(404, "Milestone not found");
    }

    const {
      title,
      description,
      target_date,
      priority,
      status,
      progress,
      completed_at,
    } = req.body;

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const allowedStatuses = [
      "NOT_STARTED",
      "IN_PROGRESS",
      "COMPLETED",
      "AT_RISK",
    ];

    if (priority !== undefined && !allowedPriorities.includes(priority)) {
      throw createError(400, "Invalid milestone priority");
    }

    if (status !== undefined && !allowedStatuses.includes(status)) {
      throw createError(400, "Invalid milestone status");
    }

    if (progress !== undefined && progress !== null) {
      const numericProgress = Number(progress);

      if (
        !Number.isInteger(numericProgress) ||
        numericProgress < 0 ||
        numericProgress > 100
      ) {
        throw createError(
          400,
          "Milestone progress must be an integer from 0 to 100",
        );
      }
    }

    const finalStatus = status ?? existingMilestone.status;
    const finalProgress =
      progress !== undefined && progress !== null
        ? Number(progress)
        : existingMilestone.progress;

    const milestone = await prisma.portfolioMilestone.update({
      where: {
        id: existingMilestone.id,
      },
      data: {
        ...(title !== undefined && {
          title: title.trim(),
        }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(target_date !== undefined && {
          target_date: target_date ? new Date(target_date) : null,
        }),
        ...(priority !== undefined && {
          priority,
        }),
        ...(status !== undefined && {
          status,
        }),
        ...(progress !== undefined && {
          progress: progress === null ? 0 : Number(progress),
        }),
        ...(completed_at !== undefined && {
          completed_at: completed_at ? new Date(completed_at) : null,
        }),
        ...(finalStatus === "COMPLETED" && {
          progress: 100,
          completed_at: completed_at ? new Date(completed_at) : new Date(),
        }),
        ...(finalStatus !== "COMPLETED" &&
          existingMilestone.status === "COMPLETED" &&
          status !== undefined && {
            completed_at: null,
          }),
        ...(finalProgress === 100 &&
          finalStatus !== "COMPLETED" && {
            progress: 100,
          }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        supporting_documents: {
          include: {
            document: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: milestone,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/portfolio/:id/milestones/:milestoneId
 * Delete a milestone
 */
export const deletePortfolioMilestone = async (req, res, next) => {
  try {
    const { investment } = await getPortfolioInvestmentForUser(
      req.params.id,
      req.user,
    );

    const milestone = await prisma.portfolioMilestone.findFirst({
      where: {
        id: req.params.milestoneId,
        investment_id: investment.id,
      },
    });

    if (!milestone) {
      throw createError(404, "Milestone not found");
    }

    await prisma.portfolioMilestone.delete({
      where: {
        id: milestone.id,
      },
    });

    res.json({
      success: true,
      message: "Milestone deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/portfolio
 * Add an existing KuberList startup to portfolio
 */
export const createPortfolioInvestment = async (req, res, next) => {
  try {
    validateInvestmentInput(req.body);

    const {
      listing_id,
      connection_id,
      invested_amount,
      invested_at,
      instrument,
      entry_valuation,
      ownership_percentage,
      status,
      current_value_override,
      exit_value,
      exited_at,
      notes,
    } = req.body;

    if (!listing_id) {
      throw createError(400, "listing_id is required");
    }

    const listing = await prisma.startupListing.findUnique({
      where: {
        id: listing_id,
      },
    });

    if (!listing) {
      throw createError(404, "Startup listing not found");
    }

    if (connection_id) {
      const connection = await prisma.connection.findFirst({
        where: {
          id: connection_id,
          investor_id: req.user.id,
        },
      });

      if (!connection) {
        throw createError(404, "Connection not found");
      }
    }

    const investment = await prisma.investment.create({
      data: {
        investor_id: req.user.id,
        listing_id,
        connection_id: connection_id || null,
        invested_amount: Number(invested_amount),
        invested_at: new Date(invested_at),
        instrument,
        entry_valuation:
          entry_valuation !== undefined && entry_valuation !== null
            ? Number(entry_valuation)
            : null,
        ownership_percentage:
          ownership_percentage !== undefined && ownership_percentage !== null
            ? Number(ownership_percentage)
            : null,
        status: status || "ACTIVE",
        current_value_override:
          current_value_override !== undefined &&
          current_value_override !== null
            ? Number(current_value_override)
            : null,
        exit_value:
          exit_value !== undefined && exit_value !== null
            ? Number(exit_value)
            : null,
        exited_at: exited_at ? new Date(exited_at) : null,
        notes: notes || null,
      },
      include: investmentInclude,
    });

    res.status(201).json({
      success: true,
      data: investment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/portfolio/external
 * Create an external organization and investment
 */
export const createExternalInvestment = async (req, res, next) => {
  try {
    validateInvestmentInput(req.body);

    const {
      name,
      website,
      sector,
      country,
      description,

      invested_amount,
      invested_at,
      instrument,
      entry_valuation,
      ownership_percentage,
      status,
      current_value_override,
      exit_value,
      exited_at,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      throw createError(400, "Organization name is required");
    }

    const investment = await prisma.$transaction(async (tx) => {
      const organization = await tx.externalOrganization.create({
        data: {
          investor_id: req.user.id,
          name: name.trim(),
          website: website || null,
          sector: sector || null,
          country: country || null,
          description: description || null,
        },
      });

      return tx.investment.create({
        data: {
          investor_id: req.user.id,
          external_organization_id: organization.id,

          invested_amount: Number(invested_amount),
          invested_at: new Date(invested_at),
          instrument,

          entry_valuation:
            entry_valuation !== undefined && entry_valuation !== null
              ? Number(entry_valuation)
              : null,

          ownership_percentage:
            ownership_percentage !== undefined && ownership_percentage !== null
              ? Number(ownership_percentage)
              : null,

          status: status || "ACTIVE",

          current_value_override:
            current_value_override !== undefined &&
            current_value_override !== null
              ? Number(current_value_override)
              : null,

          exit_value:
            exit_value !== undefined && exit_value !== null
              ? Number(exit_value)
              : null,

          exited_at: exited_at ? new Date(exited_at) : null,

          notes: notes || null,
        },
        include: investmentInclude,
      });
    });

    res.status(201).json({
      success: true,
      data: investment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/portfolio/:id
 * Update investment
 */
export const updateInvestment = async (req, res, next) => {
  try {
    const existingInvestment = await prisma.investment.findFirst({
      where: {
        id: req.params.id,
        investor_id: req.user.id,
      },
    });

    if (!existingInvestment) {
      throw createError(404, "Investment not found");
    }

    const {
      invested_amount,
      invested_at,
      instrument,
      entry_valuation,
      ownership_percentage,
      status,
      current_value_override,
      exit_value,
      exited_at,
      notes,
    } = req.body;

    if (ownership_percentage !== undefined) {
      const ownership = Number(ownership_percentage);

      if (ownership < 0 || ownership > 100) {
        throw createError(
          400,
          "Ownership percentage must be between 0 and 100",
        );
      }
    }

    const investment = await prisma.investment.update({
      where: {
        id: existingInvestment.id,
      },
      data: {
        ...(invested_amount !== undefined && {
          invested_amount: Number(invested_amount),
        }),

        ...(invested_at && {
          invested_at: new Date(invested_at),
        }),

        ...(instrument && {
          instrument,
        }),

        ...(entry_valuation !== undefined && {
          entry_valuation:
            entry_valuation === null ? null : Number(entry_valuation),
        }),

        ...(ownership_percentage !== undefined && {
          ownership_percentage:
            ownership_percentage === null ? null : Number(ownership_percentage),
        }),

        ...(status && {
          status,
        }),

        ...(current_value_override !== undefined && {
          current_value_override:
            current_value_override === null
              ? null
              : Number(current_value_override),
        }),

        ...(exit_value !== undefined && {
          exit_value: exit_value === null ? null : Number(exit_value),
        }),

        ...(exited_at !== undefined && {
          exited_at: exited_at === null ? null : new Date(exited_at),
        }),

        ...(notes !== undefined && {
          notes,
        }),
      },
      include: investmentInclude,
    });

    res.json({
      success: true,
      data: investment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/portfolio/:id
 * Delete an investment owned by the investor
 */

/**
 * GET /api/portfolio/:id/messages
 * Get post-investment portfolio chat messages
 */
export const getPortfolioMessages = async (req, res, next) => {
  try {
    const { investment } = await getPortfolioInvestmentForUser(
      req.params.id,
      req.user,
    );

    if (!investment.listing_id) {
      throw createError(
        400,
        "External investments do not support portfolio chat",
      );
    }

    const messages = await prisma.portfolioMessage.findMany({
      where: {
        investment_id: investment.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
      take: 100,
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
 * POST /api/portfolio/:id/messages
 * Send a post-investment portfolio chat message
 */
export const sendPortfolioMessage = async (req, res, next) => {
  try {
    const { investment } = await getPortfolioInvestmentForUser(
      req.params.id,
      req.user,
    );

    if (!investment.listing_id) {
      throw createError(
        400,
        "External investments do not support portfolio chat",
      );
    }

    const message = req.body?.message?.trim();

    if (!message) {
      throw createError(400, "Message is required");
    }

    if (message.length > 5000) {
      throw createError(
        400,
        "Message cannot exceed 5000 characters",
      );
    }

    const portfolioMessage = await prisma.portfolioMessage.create({
      data: {
        investment_id: investment.id,
        sender_id: req.user.id,
        message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const recipientId =
      req.user.id === investment.investor_id
        ? investment.listing.capital_seeker_id
        : investment.investor_id;

    const recipientRole =
      req.user.id === investment.investor_id
        ? "CAPITAL_SEEKER"
        : "INVESTOR";

    if (recipientId) {
      notifyPortfolioMessageReceived(
        recipientId,
        portfolioMessage.sender?.name || req.user.name || "Someone",
        investment.listing?.name || "your investment",
        investment.id,
        recipientRole,
      ).catch((err) => {
        console.error("[Portfolio Notification] Failed:", err);
      });
    }

    res.status(201).json({
      success: true,
      data: portfolioMessage,
    });
  } catch (err) {
    next(err);
  }
};
export const deleteInvestment = async (req, res, next) => {
  try {
    const investment = await prisma.investment.findFirst({
      where: {
        id: req.params.id,
        investor_id: req.user.id,
      },
    });

    if (!investment) {
      throw createError(404, "Investment not found");
    }

    await prisma.investment.delete({
      where: {
        id: investment.id,
      },
    });

    res.json({
      success: true,
      message: "Investment deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};







