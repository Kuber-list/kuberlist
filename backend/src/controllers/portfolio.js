import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";

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
      where: {
        investor_id: req.user.id,
      },
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
      where: {
        investor_id: req.user.id,
      },
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
        current_value: 0,
        realized_value: 0,
      },
    );

    summary.unrealized_gain_loss =
      summary.current_value - summary.total_invested;

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
