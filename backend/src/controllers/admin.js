import { notifyListingApproved } from "../services/notification.service.js";
import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";

export const getMetrics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      capitalSeekers,
      investors,
      totalListings,
      activeListings,
      underReview,
      totalInterests,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CAPITAL_SEEKER" } }),
      prisma.user.count({ where: { role: "INVESTOR" } }),
      prisma.startupListing.count(),
      prisma.startupListing.count({ where: { status: "ACTIVE" } }),
      prisma.startupListing.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.interest.count(),
    ]);
    res.json({
      success: true,
      data: {
        totalUsers,
        capitalSeekers,
        investors,
        totalListings,
        activeListings,
        underReview,
        totalInterests,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const where = role ? { role } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_system: true,
          profile_image_url: true,
          created_at: true,
          _count: {
            select: {
              listings: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getListings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 15 } = req.query;
    const where = status ? { status } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [listings, total] = await Promise.all([
      prisma.startupListing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: "desc" },
        include: {
          capital_seeker: { select: { id: true, name: true, email: true } },
          _count: { select: { interests: true } },
        },
      }),
      prisma.startupListing.count({ where }),
    ]);
    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          page: parseInt(page),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const reviewListing = async (req, res, next) => {
  try {
    const { status, rejection_reason } = req.body;
    if (!["ACTIVE", "INACTIVE", "UNDER_REVIEW"].includes(status))
      throw createError(400, "Invalid status");
    const data = { status };
    // Store rejection reason when deactivating; clear it when approving
    if (status === "INACTIVE") data.rejection_reason = rejection_reason || null;
    if (status === "ACTIVE") data.rejection_reason = null;
    const listing = await prisma.startupListing.update({
      where: { id: req.params.id },
      data,
    });
    if (status === "ACTIVE") {
      notifyListingApproved(
        listing.capital_seeker_id,
        listing.name,
        listing.id,
      ).catch(() => {});
    }
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
};

export const getAllInterests = async (req, res, next) => {
  try {
    const interests = await prisma.interest.findMany({
      include: {
        investor: { select: { id: true, name: true, email: true } },
        startup: {
          select: {
            id: true,
            name: true,
            capital_seeker: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    res.json({ success: true, data: interests });
  } catch (err) {
    next(err);
  }
};
