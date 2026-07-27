import { scoreListing } from "../services/scoring.js";
import { getDecision } from "../services/decision.service.js";
import {
  buildUserProfile,
  blendMatchScore,
  calculateRankScore,
} from "../services/personalization.service.js";
import { generateWhy } from "../services/why.service.js";
import { trackActivity } from "../middleware/activity.js";
import prisma from "../utils/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import {
  refreshListingScore,
  persistScore,
} from "../services/score.service.js";
const listingInclude = {
  capital_seeker: {
    select: { id: true, name: true, email: true, capitalSeekerProfile: true },
  },
  _count: { select: { interests: true, savedBy: true } },
  score: true,
};

export const createListing = async (req, res, next) => {
  try {
    const {
      name,
      sector,
      stage,
      entity_type,
      location_city,
      location_country,
      funding_ask,
      valuation_expectation,
      revenue_last_year,
      monthly_burn,
      requires_nda,
      summary,
      use_of_funds,
      has_purchase_orders,
      po_value,
      po_count,
      has_government_contract,
      has_ip,
      ip_description,
      patent_number,
      awards_recognition,
    } = req.body;
    if (!name || !sector || !stage || !summary)
      throw createError(400, "name, sector, stage and summary are required");

    const listing = await prisma.startupListing.create({
      data: {
        capital_seeker_id: req.user.id,
        name,
        sector,
        stage,
        entity_type: entity_type || "STARTUP",
        location_city: location_city || null,
        location_country: location_country || "India",
        funding_ask: funding_ask ? parseFloat(funding_ask) : null,
        valuation_expectation: valuation_expectation
          ? parseFloat(valuation_expectation)
          : null,
        revenue_last_year: revenue_last_year
          ? parseFloat(revenue_last_year)
          : null,
        monthly_burn: monthly_burn ? parseFloat(monthly_burn) : null,
        requires_nda: !!requires_nda,
        summary,
        use_of_funds: use_of_funds || null,
        has_purchase_orders: !!has_purchase_orders,
        po_value: po_value ? parseFloat(po_value) : null,
        po_count: po_count ? parseInt(po_count) : null,
        has_government_contract: !!has_government_contract,
        has_ip: !!has_ip,
        ip_description: ip_description || null,
        patent_number: patent_number || null,
        awards_recognition: awards_recognition || null,
        status: "DRAFT",
      },
      include: listingInclude,
    });
    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
};

export const getMyListings = async (req, res, next) => {
  try {
    const listings = await prisma.startupListing.findMany({
      where: { capital_seeker_id: req.user.id },
      include: listingInclude,
      orderBy: { created_at: "desc" },
    });
    res.json({ success: true, data: listings });
  } catch (err) {
    next(err);
  }
};

export const getMyListing = async (req, res, next) => {
  try {
    const listing = await prisma.startupListing.findFirst({
      where: { id: req.params.id, capital_seeker_id: req.user.id },
      include: {
        ...listingInclude,
        interests: {
          include: {
            investor: {
              select: {
                id: true,
                name: true,
                email: true,
                investorProfile: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        },
        documents: true,
        updates: { orderBy: { created_at: "desc" } },
      },
    });
    if (!listing) throw createError(404, "Listing not found");
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
};

export const updateListing = async (req, res, next) => {
  try {
    const existing = await prisma.startupListing.findFirst({
      where: { id: req.params.id, capital_seeker_id: req.user.id },
    });
    if (!existing) throw createError(404, "Listing not found");

    const {
      name,
      sector,
      stage,
      entity_type,
      location_city,
      location_country,
      funding_ask,
      valuation_expectation,
      revenue_last_year,
      monthly_burn,
      requires_nda,
      summary,
      use_of_funds,
      is_active,
    } = req.body;

    const listing = await prisma.startupListing.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(sector && { sector }),
        ...(stage && { stage }),
        ...(entity_type && { entity_type }),
        ...(location_city !== undefined && { location_city }),
        ...(location_country !== undefined && { location_country }),
        ...(funding_ask !== undefined && {
          funding_ask: funding_ask ? parseFloat(funding_ask) : null,
        }),
        ...(valuation_expectation !== undefined && {
          valuation_expectation: valuation_expectation
            ? parseFloat(valuation_expectation)
            : null,
        }),
        ...(revenue_last_year !== undefined && {
          revenue_last_year: revenue_last_year
            ? parseFloat(revenue_last_year)
            : null,
        }),
        ...(monthly_burn !== undefined && {
          monthly_burn: monthly_burn ? parseFloat(monthly_burn) : null,
        }),
        ...(requires_nda !== undefined && {
          requires_nda: !!requires_nda,
        }),
        ...(summary && { summary }),
        ...(use_of_funds !== undefined && { use_of_funds }),
        ...(is_active !== undefined && { is_active }),
        ...(req.body.has_purchase_orders !== undefined && {
          has_purchase_orders: !!req.body.has_purchase_orders,
        }),
        ...(req.body.po_value !== undefined && {
          po_value: req.body.po_value ? parseFloat(req.body.po_value) : null,
        }),
        ...(req.body.po_count !== undefined && {
          po_count: req.body.po_count ? parseInt(req.body.po_count) : null,
        }),
        ...(req.body.has_government_contract !== undefined && {
          has_government_contract: !!req.body.has_government_contract,
        }),
        ...(req.body.has_ip !== undefined && { has_ip: !!req.body.has_ip }),
        ...(req.body.ip_description !== undefined && {
          ip_description: req.body.ip_description || null,
        }),
        ...(req.body.patent_number !== undefined && {
          patent_number: req.body.patent_number || null,
        }),
        ...(req.body.awards_recognition !== undefined && {
          awards_recognition: req.body.awards_recognition || null,
        }),
      },
      include: listingInclude,
    });
    res.json({ success: true, data: listing });
    void refreshListingScore(req.params.id).catch((err) => {
      console.error("[Score Refresh]", err);
    });
  } catch (err) {
    next(err);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const existing = await prisma.startupListing.findFirst({
      where: { id: req.params.id, capital_seeker_id: req.user.id },
    });
    if (!existing) throw createError(404, "Listing not found");
    await prisma.startupListing.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Listing deleted" });
  } catch (err) {
    next(err);
  }
};

export const submitListing = async (req, res, next) => {
  try {
    const existing = await prisma.startupListing.findFirst({
      where: { id: req.params.id, capital_seeker_id: req.user.id },
    });
    if (!existing) throw createError(404, "Listing not found");
    if (!["DRAFT", "INACTIVE"].includes(existing.status))
      throw createError(
        400,
        "Only draft or rejected listings can be submitted",
      );
    const listing = await prisma.startupListing.update({
      where: { id: req.params.id },
      data: { status: "UNDER_REVIEW" },
    });
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
};

// Public browse with filters + personalized ranking
export const browseListings = async (req, res, next) => {
  try {
    const {
      search,
      sector,
      stage,
      entity_type,
      funding_min,
      funding_max,
      revenue_min,
      revenue_max,
      location,
      sort = "ranked",
      page = 1,
      limit = 12,
    } = req.query;

    const where = {
      status: "ACTIVE",
      is_active: true,
      ...(sector && { sector }),
      ...(stage && { stage }),
      ...(entity_type && { entity_type }),
      ...(location && {
        location_city: { contains: location, mode: "insensitive" },
      }),
      ...(funding_min || funding_max
        ? {
            funding_ask: {
              ...(funding_min && { gte: parseFloat(funding_min) }),
              ...(funding_max && { lte: parseFloat(funding_max) }),
            },
          }
        : {}),
      ...(revenue_min || revenue_max
        ? {
            revenue_last_year: {
              ...(revenue_min && { gte: parseFloat(revenue_min) }),
              ...(revenue_max && { lte: parseFloat(revenue_max) }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { summary: { contains: search, mode: "insensitive" } },
          { sector: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // Fetch more than needed for ranking then paginate
    const fetchLimit = sort === "ranked" ? 100 : parseInt(limit);
    const [allListings, total] = await Promise.all([
      prisma.startupListing.findMany({
        where,
        include: {
          ...listingInclude,
          documents: { select: { document_type: true } },
          _count: {
            select: { interests: true, updates: true, documents: true },
          },
          capital_seeker: { include: { capitalSeekerProfile: true } },
        },
        orderBy: { created_at: "desc" },
        take: fetchLimit,
      }),
      prisma.startupListing.count({ where }),
    ]);

    // Build personalized ranking if user is an investor
    let listings = allListings;
    if (req.user?.role === "INVESTOR" && sort === "ranked") {
      const [activityProfile, investorProfile, savedIds, existingScores] =
        await Promise.all([
          buildUserProfile(req.user.id),
          prisma.investorProfile.findUnique({
            where: { user_id: req.user.id },
          }),
          prisma.savedStartup
            .findMany({
              where: { investor_id: req.user.id },
              select: { startup_id: true },
            })
            .then((r) => r.map((s) => s.startup_id)),
          prisma.listingScore
            .findMany({
              where: { listing_id: { in: allListings.map((l) => l.id) } },
            })
            .then((r) => Object.fromEntries(r.map((s) => [s.listing_id, s]))),
        ]);

      // Track this browse as VIEW for each sector seen
      const seenSectors = new Set(
        allListings.map((l) => l.sector).filter(Boolean),
      );
      seenSectors.forEach((sec) => {
        trackActivity(req.user.id, null, "VIEW", sec).catch(() => {});
      });

      // Score + rank each listing
      const scored = allListings.map((l) => {
        const profile = l.capital_seeker?.capitalSeekerProfile;
        const docTypes = (l.documents || []).map((d) => d.document_type);
        const prevScore = existingScores[l.id];

        const isStale = !prevScore || prevScore.last_updated < l.updated_at;

        let scores;

        if (isStale) {
          scores = scoreListing(
            l,
            profile,
            docTypes,
            l._count?.updates || 0,
            prevScore,
          );

          // Save refreshed score in background
          persistScore(l.id, scores).catch((err) => {
            console.error("[Score Cache]", err);
          });
        } else {
          scores = prevScore;
        }
        const decision = getDecision(scores);
        const matchScore = blendMatchScore(activityProfile, investorProfile, l);
        const rankScore = calculateRankScore(
          matchScore,
          scores.total_score,
          scores.momentum_score,
        );
        const isSaved = savedIds.includes(l.id);
        const why = generateWhy(
          l,
          scores,
          matchScore,
          activityProfile,
          investorProfile,
          isSaved,
        );

        // Exploration: 5% of feed = quality listings not yet seen (readiness>=50 or momentum>=6)
        const roll = parseInt(l.id.replace(/-/g, "").slice(-4), 16) % 100;

        const isExploration =
          roll < 5 && (scores.total_score >= 50 || scores.momentum_score >= 6);

        return {
          ...l,
          documents: undefined, // strip internal field
          total_score: scores.total_score,
          hard_score: scores.hard_score,
          quality: scores.quality,
          confidence_score: scores.confidence_score,
          confidence_label: scores.confidence_label,
          risk_score: scores.risk_score,
          momentum_score: scores.momentum_score,
          grade: scores.grade,
          verdict: scores.verdict,
          top_drivers: scores.top_drivers,
          top_risks: scores.top_risks,
          decision,
          matchScore,
          rankScore,
          why_this_deal: why,
          isSaved,
          _rank: isExploration ? rankScore + 5 : rankScore,
        };
      });

      // Sort by rank score descending
      scored.sort((a, b) => b._rank - a._rank);

      const skip = (parseInt(page) - 1) * parseInt(limit);
      listings = scored.slice(skip, skip + parseInt(limit));
    } else {
      // Non-investor or non-ranked: standard pagination
      const orderBy =
        sort === "funding" ? { funding_ask: "desc" } : { created_at: "desc" };
      const skip = (parseInt(page) - 1) * parseInt(limit);
      listings = await prisma.startupListing.findMany({
        where,
        include: listingInclude,
        orderBy,
        skip,
        take: parseInt(limit),
      });
    }

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

export const getPublicListing = async (req, res, next) => {
  try {
    const listing = await prisma.startupListing.findFirst({
      where: { id: req.params.id, status: "ACTIVE", is_active: true },
      include: {
        ...listingInclude,
        documents: { where: { visibility: "PUBLIC" } },
        updates: { orderBy: { created_at: "desc" }, take: 5 },
      },
    });
    if (!listing) throw createError(404, "Listing not found");
    // Increment view count in background
    prisma.startupListing
      .update({
        where: { id: listing.id },
        data: { view_count: { increment: 1 } },
      })
      .catch(() => {});
    // Track activity if authenticated
    if (req.user)
      trackActivity(req.user.id, listing.id, "VIEW", listing.sector).catch(
        () => {},
      );
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
};
