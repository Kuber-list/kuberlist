import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";

const opportunityInclude = {
  seller: {
    select: {
      id: true,
      name: true,
    },
  },

  investment: {
    include: {
      listing: true,
      external_organization: true,
    },
  },

  listing: {
    select: {
      id: true,
      name: true,
      sector: true,
      stage: true,
      location_city: true,
      location_country: true,
      summary: true,
    },
  },

  external_organization: true,
};

const validateOpportunityInput = (body) => {
  const {
    instrument,
    sale_type,
    asking_price,
    ownership_percentage,
    minimum_transaction_size,
    price_visibility,
    expires_at,
  } = body;

  const allowedSaleTypes = ["FULL", "PARTIAL"];
  const allowedPriceVisibility = ["PUBLIC", "ON_REQUEST"];

  if (!instrument) {
    throw createError(400, "Investment instrument is required");
  }

  if (!sale_type || !allowedSaleTypes.includes(sale_type)) {
    throw createError(400, "Valid sale type is required");
  }

  if (
    asking_price === undefined ||
    asking_price === null ||
    asking_price === "" ||
    Number(asking_price) <= 0
  ) {
    throw createError(400, "Valid asking price is required");
  }

  if (
    ownership_percentage !== undefined &&
    ownership_percentage !== null &&
    ownership_percentage !== ""
  ) {
    const ownership = Number(ownership_percentage);

    if (ownership <= 0 || ownership > 100) {
      throw createError(
        400,
        "Ownership percentage must be greater than 0 and at most 100",
      );
    }
  }

  if (
    minimum_transaction_size !== undefined &&
    minimum_transaction_size !== null &&
    minimum_transaction_size !== ""
  ) {
    if (Number(minimum_transaction_size) <= 0) {
      throw createError(400, "Minimum transaction size must be greater than 0");
    }
  }

  if (price_visibility && !allowedPriceVisibility.includes(price_visibility)) {
    throw createError(400, "Invalid price visibility");
  }

  if (expires_at) {
    const expiryDate = new Date(expires_at);

    if (Number.isNaN(expiryDate.getTime())) {
      throw createError(400, "Invalid expiry date");
    }

    if (expiryDate <= new Date()) {
      throw createError(400, "Expiry date must be in the future");
    }
  }
};

const resolveOpportunityOrganization = async ({
  investment_id,
  listing_id,
  external_organization_id,
  seller_id,
}) => {
  if (investment_id) {
    const investment = await prisma.investment.findFirst({
      where: {
        id: investment_id,
        investor_id: seller_id,
      },
      include: {
        listing: true,
        external_organization: true,
      },
    });

    if (!investment) {
      throw createError(404, "Portfolio investment not found");
    }

    if (investment.status !== "ACTIVE") {
      throw createError(
        400,
        "Only active investments can be listed as secondary opportunities",
      );
    }

    if (!investment.listing_id && !investment.external_organization_id) {
      throw createError(400, "Investment is not linked to an organization");
    }

    return {
      investment_id: investment.id,
      listing_id: investment.listing_id || null,
      external_organization_id: investment.external_organization_id || null,
    };
  }

  if (listing_id && external_organization_id) {
    throw createError(
      400,
      "Choose either a KuberList company or an external company",
    );
  }

  if (!listing_id && !external_organization_id) {
    throw createError(
      400,
      "A portfolio investment, KuberList company, or external company is required",
    );
  }

  if (listing_id) {
    const listing = await prisma.startupListing.findUnique({
      where: {
        id: listing_id,
      },
    });

    if (!listing) {
      throw createError(404, "Startup listing not found");
    }

    return {
      investment_id: null,
      listing_id: listing.id,
      external_organization_id: null,
    };
  }

  const organization = await prisma.externalOrganization.findFirst({
    where: {
      id: external_organization_id,
      investor_id: seller_id,
    },
  });

  if (!organization) {
    throw createError(404, "External organization not found");
  }

  return {
    investment_id: null,
    listing_id: null,
    external_organization_id: organization.id,
  };
};

/**
 * GET /api/secondary-opportunities
 * Get all LIVE secondary opportunities
 */
export const getLiveSecondaryOpportunities = async (req, res, next) => {
  try {
    const opportunities = await prisma.secondaryOpportunity.findMany({
      where: {
        status: "LIVE",
        OR: [
          {
            expires_at: null,
          },
          {
            expires_at: {
              gt: new Date(),
            },
          },
        ],
      },
      include: opportunityInclude,
      orderBy: {
        created_at: "desc",
      },
    });

    res.json({
      success: true,
      data: opportunities,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/secondary-opportunities/my
 * Get all opportunities created by the logged-in seller
 */
export const getMySecondaryOpportunities = async (req, res, next) => {
  try {
    const opportunities = await prisma.secondaryOpportunity.findMany({
      where: {
        seller_id: req.user.id,
      },
      include: opportunityInclude,
      orderBy: {
        created_at: "desc",
      },
    });

    res.json({
      success: true,
      data: opportunities,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/secondary-opportunities/:id
 * Get one secondary opportunity
 */
export const getSecondaryOpportunity = async (req, res, next) => {
  try {
    const opportunity = await prisma.secondaryOpportunity.findUnique({
      where: {
        id: req.params.id,
      },
      include: opportunityInclude,
    });

    if (!opportunity) {
      throw createError(404, "Secondary opportunity not found");
    }

    const isSeller = opportunity.seller_id === req.user.id;

    const isLiveAndVisible =
      opportunity.status === "LIVE" &&
      (!opportunity.expires_at || opportunity.expires_at > new Date());

    if (!isSeller && !isLiveAndVisible) {
      throw createError(404, "Secondary opportunity not found");
    }

    res.json({
      success: true,
      data: opportunity,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-opportunities/:id/interest
 * Investor expresses interest in a LIVE secondary opportunity
 */
export const expressSecondaryInterest = async (req, res, next) => {
  try {
    const { message } = req.body;

    const opportunity = await prisma.secondaryOpportunity.findFirst({
      where: {
        id: req.params.id,
        status: "LIVE",
        OR: [
          {
            expires_at: null,
          },
          {
            expires_at: {
              gt: new Date(),
            },
          },
        ],
      },
    });

    if (!opportunity) {
      throw createError(404, "Live secondary opportunity not found");
    }

    if (opportunity.seller_id === req.user.id) {
      throw createError(
        400,
        "You cannot express interest in your own opportunity",
      );
    }

    const existingInterest = await prisma.secondaryInterest.findUnique({
      where: {
        opportunity_id_investor_id: {
          opportunity_id: opportunity.id,
          investor_id: req.user.id,
        },
      },
    });

    if (existingInterest) {
      throw createError(
        400,
        "You have already expressed interest in this opportunity",
      );
    }

    const interest = await prisma.secondaryInterest.create({
      data: {
        opportunity_id: opportunity.id,
        investor_id: req.user.id,
        message: message?.trim() || null,
        status: "EXPRESSED",
      },
    });

    res.status(201).json({
      success: true,
      data: interest,
      message: "Interest expressed successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/secondary-opportunities/:id/interests
 * Get investors interested in an opportunity owned by the logged-in seller
 */
export const getSecondaryOpportunityInterests = async (req, res, next) => {
  try {
    const opportunity = await prisma.secondaryOpportunity.findFirst({
      where: {
        id: req.params.id,
        seller_id: req.user.id,
      },
    });

    if (!opportunity) {
      throw createError(404, "Secondary opportunity not found");
    }

    const interests = await prisma.secondaryInterest.findMany({
      where: {
        opportunity_id: opportunity.id,
      },
      include: {
        investor: {
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
      data: interests,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-opportunities/:id/interests/:interestId/approve
 * Seller approves an investor's interest
 */
/**
 * POST /api/secondary-opportunities/:id/interests/:interestId/approve
 * Seller approves an investor's interest and creates a secondary deal
 */
export const approveSecondaryInterest = async (req, res, next) => {
  try {
    const opportunity = await prisma.secondaryOpportunity.findFirst({
      where: {
        id: req.params.id,
        seller_id: req.user.id,
      },
    });

    if (!opportunity) {
      throw createError(404, "Secondary opportunity not found");
    }

    if (opportunity.status !== "LIVE") {
      throw createError(
        400,
        "Interests can only be approved for a live opportunity",
      );
    }

    const interest = await prisma.secondaryInterest.findFirst({
      where: {
        id: req.params.interestId,
        opportunity_id: opportunity.id,
      },
    });

    if (!interest) {
      throw createError(404, "Investor interest not found");
    }

    if (interest.status !== "EXPRESSED") {
      throw createError(400, "Only newly expressed interest can be approved");
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedInterest = await tx.secondaryInterest.update({
        where: {
          id: interest.id,
        },
        data: {
          status: "APPROVED",
        },
        include: {
          investor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      const secondaryDeal = await tx.secondaryDeal.create({
        data: {
          opportunity: {
            connect: {
              id: opportunity.id,
            },
          },

          secondary_interest: {
            connect: {
              id: interest.id,
            },
          },

          seller: {
            connect: {
              id: opportunity.seller_id,
            },
          },

          buyer: {
            connect: {
              id: interest.investor_id,
            },
          },
        },
      });
      return {
        updatedInterest,
        secondaryDeal,
      };
    });

    res.json({
      success: true,
      data: result.updatedInterest,
      deal: result.secondaryDeal,
      message:
        "Investor interest approved and secondary deal created successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-opportunities/:id/interests/:interestId/decline
 * Seller declines an investor's interest
 */
export const declineSecondaryInterest = async (req, res, next) => {
  try {
    const opportunity = await prisma.secondaryOpportunity.findFirst({
      where: {
        id: req.params.id,
        seller_id: req.user.id,
      },
    });

    if (!opportunity) {
      throw createError(404, "Secondary opportunity not found");
    }

    const interest = await prisma.secondaryInterest.findFirst({
      where: {
        id: req.params.interestId,
        opportunity_id: opportunity.id,
      },
    });

    if (!interest) {
      throw createError(404, "Investor interest not found");
    }

    if (interest.status !== "EXPRESSED") {
      throw createError(400, "Only newly expressed interest can be declined");
    }

    const updatedInterest = await prisma.secondaryInterest.update({
      where: {
        id: interest.id,
      },
      data: {
        status: "DECLINED",
      },
      include: {
        investor: {
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
      data: updatedInterest,
      message: "Investor interest declined",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-opportunities
 * Create a secondary opportunity as DRAFT
 */
export const createSecondaryOpportunity = async (req, res, next) => {
  try {
    validateOpportunityInput(req.body);

    const {
      investment_id,
      listing_id,
      external_organization_id,
      instrument,
      sale_type,
      ownership_percentage,
      stake_description,
      asking_price,
      price_visibility,
      minimum_transaction_size,
      expires_at,
      notes,
    } = req.body;

    const organization = await resolveOpportunityOrganization({
      investment_id,
      listing_id,
      external_organization_id,
      seller_id: req.user.id,
    });

    const opportunity = await prisma.secondaryOpportunity.create({
      data: {
        seller_id: req.user.id,

        investment_id: organization.investment_id,
        listing_id: organization.listing_id,
        external_organization_id: organization.external_organization_id,

        instrument,
        sale_type,

        ownership_percentage:
          ownership_percentage !== undefined &&
          ownership_percentage !== null &&
          ownership_percentage !== ""
            ? Number(ownership_percentage)
            : null,

        stake_description: stake_description?.trim() || null,

        asking_price: Number(asking_price),

        price_visibility: price_visibility || "PUBLIC",

        minimum_transaction_size:
          minimum_transaction_size !== undefined &&
          minimum_transaction_size !== null &&
          minimum_transaction_size !== ""
            ? Number(minimum_transaction_size)
            : null,

        expires_at: expires_at ? new Date(expires_at) : null,

        notes: notes?.trim() || null,

        status: "DRAFT",
      },
      include: opportunityInclude,
    });

    res.status(201).json({
      success: true,
      data: opportunity,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/secondary-opportunities/:id
 * Update an opportunity owned by the seller
 */
export const updateSecondaryOpportunity = async (req, res, next) => {
  try {
    const existingOpportunity = await prisma.secondaryOpportunity.findFirst({
      where: {
        id: req.params.id,
        seller_id: req.user.id,
      },
    });

    if (!existingOpportunity) {
      throw createError(404, "Secondary opportunity not found");
    }

    if (!["DRAFT", "REJECTED"].includes(existingOpportunity.status)) {
      throw createError(
        400,
        "Only draft or rejected opportunities can be edited",
      );
    }

    const {
      instrument,
      sale_type,
      ownership_percentage,
      stake_description,
      asking_price,
      price_visibility,
      minimum_transaction_size,
      expires_at,
      notes,
    } = req.body;

    if (ownership_percentage !== undefined) {
      if (ownership_percentage !== null && ownership_percentage !== "") {
        const ownership = Number(ownership_percentage);

        if (ownership <= 0 || ownership > 100) {
          throw createError(
            400,
            "Ownership percentage must be greater than 0 and at most 100",
          );
        }
      }
    }

    if (asking_price !== undefined) {
      if (
        asking_price === null ||
        asking_price === "" ||
        Number(asking_price) <= 0
      ) {
        throw createError(400, "Valid asking price is required");
      }
    }

    if (
      minimum_transaction_size !== undefined &&
      minimum_transaction_size !== null &&
      minimum_transaction_size !== ""
    ) {
      if (Number(minimum_transaction_size) <= 0) {
        throw createError(
          400,
          "Minimum transaction size must be greater than 0",
        );
      }
    }

    if (expires_at !== undefined && expires_at) {
      const expiryDate = new Date(expires_at);

      if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        throw createError(400, "Expiry date must be in the future");
      }
    }

    const opportunity = await prisma.secondaryOpportunity.update({
      where: {
        id: existingOpportunity.id,
      },
      data: {
        ...(instrument !== undefined && {
          instrument,
        }),

        ...(sale_type !== undefined && {
          sale_type,
        }),

        ...(ownership_percentage !== undefined && {
          ownership_percentage:
            ownership_percentage === null || ownership_percentage === ""
              ? null
              : Number(ownership_percentage),
        }),

        ...(stake_description !== undefined && {
          stake_description: stake_description?.trim() || null,
        }),

        ...(asking_price !== undefined && {
          asking_price: Number(asking_price),
        }),

        ...(price_visibility !== undefined && {
          price_visibility,
        }),

        ...(minimum_transaction_size !== undefined && {
          minimum_transaction_size:
            minimum_transaction_size === null || minimum_transaction_size === ""
              ? null
              : Number(minimum_transaction_size),
        }),

        ...(expires_at !== undefined && {
          expires_at:
            expires_at === null || expires_at === ""
              ? null
              : new Date(expires_at),
        }),

        ...(notes !== undefined && {
          notes: notes?.trim() || null,
        }),

        ...(existingOpportunity.status === "REJECTED" && {
          rejection_reason: null,
        }),
      },
      include: opportunityInclude,
    });

    res.json({
      success: true,
      data: opportunity,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-opportunities/:id/submit
 * Submit a draft or rejected opportunity for admin review
 */
export const submitSecondaryOpportunity = async (req, res, next) => {
  try {
    const opportunity = await prisma.secondaryOpportunity.findFirst({
      where: {
        id: req.params.id,
        seller_id: req.user.id,
      },
    });

    if (!opportunity) {
      throw createError(404, "Secondary opportunity not found");
    }

    if (!["DRAFT", "REJECTED"].includes(opportunity.status)) {
      throw createError(
        400,
        "Only draft or rejected opportunities can be submitted",
      );
    }

    const updatedOpportunity = await prisma.secondaryOpportunity.update({
      where: {
        id: opportunity.id,
      },
      data: {
        status: "PENDING_REVIEW",
        rejection_reason: null,
      },
      include: opportunityInclude,
    });

    res.json({
      success: true,
      data: updatedOpportunity,
      message: "Secondary opportunity submitted for review",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-opportunities/:id/withdraw
 * Withdraw an opportunity owned by the seller
 */
export const withdrawSecondaryOpportunity = async (req, res, next) => {
  try {
    const opportunity = await prisma.secondaryOpportunity.findFirst({
      where: {
        id: req.params.id,
        seller_id: req.user.id,
      },
    });

    if (!opportunity) {
      throw createError(404, "Secondary opportunity not found");
    }

    if (["COMPLETED", "WITHDRAWN"].includes(opportunity.status)) {
      throw createError(400, "This opportunity cannot be withdrawn");
    }

    const updatedOpportunity = await prisma.secondaryOpportunity.update({
      where: {
        id: opportunity.id,
      },
      data: {
        status: "WITHDRAWN",
      },
      include: opportunityInclude,
    });

    res.json({
      success: true,
      data: updatedOpportunity,
      message: "Secondary opportunity withdrawn successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/secondary-opportunities/admin/pending
 * Get opportunities pending admin review
 */
export const getPendingSecondaryOpportunities = async (req, res, next) => {
  try {
    const opportunities = await prisma.secondaryOpportunity.findMany({
      where: {
        status: "PENDING_REVIEW",
      },
      include: opportunityInclude,
      orderBy: {
        created_at: "asc",
      },
    });

    res.json({
      success: true,
      data: opportunities,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-opportunities/:id/approve
 * Admin approves an opportunity
 */
export const approveSecondaryOpportunity = async (req, res, next) => {
  try {
    const opportunity = await prisma.secondaryOpportunity.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!opportunity) {
      throw createError(404, "Secondary opportunity not found");
    }

    if (opportunity.status !== "PENDING_REVIEW") {
      throw createError(400, "Only pending opportunities can be approved");
    }

    const updatedOpportunity = await prisma.secondaryOpportunity.update({
      where: {
        id: opportunity.id,
      },
      data: {
        status: "LIVE",
        rejection_reason: null,
      },
      include: opportunityInclude,
    });

    res.json({
      success: true,
      data: updatedOpportunity,
      message: "Secondary opportunity approved successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/secondary-opportunities/:id/reject
 * Admin rejects an opportunity
 */
export const rejectSecondaryOpportunity = async (req, res, next) => {
  try {
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      throw createError(400, "Rejection reason is required");
    }

    const opportunity = await prisma.secondaryOpportunity.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!opportunity) {
      throw createError(404, "Secondary opportunity not found");
    }

    if (opportunity.status !== "PENDING_REVIEW") {
      throw createError(400, "Only pending opportunities can be rejected");
    }

    const updatedOpportunity = await prisma.secondaryOpportunity.update({
      where: {
        id: opportunity.id,
      },
      data: {
        status: "REJECTED",
        rejection_reason: rejection_reason.trim(),
      },
      include: opportunityInclude,
    });

    res.json({
      success: true,
      data: updatedOpportunity,
      message: "Secondary opportunity rejected",
    });
  } catch (err) {
    next(err);
  }
};
