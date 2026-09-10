import prisma from "../utils/prisma.js";

/*
 * ============================================================
 * KuberList Due Diligence Engine
 * ============================================================
 *
 * IMPORTANT:
 *
 * This is NOT the existing diligence.js workflow.
 *
 * Existing:
 *   DiligenceRequest
 *   -> investor requests a document/information
 *
 * This service:
 *   DDChecklistTemplate
 *   -> DDChecklistItem
 *   -> DDRequirement
 *   -> Evidence / Verification
 *   -> DD Readiness Score
 *   -> DD Verification Score
 *
 * The existing Investment Quality / ListingScore system is
 * completely separate from these scores.
 *
 * ============================================================
 */

/*
 * ------------------------------------------------------------
 * Verification weights
 * ------------------------------------------------------------
 *
 * NONE:
 *   No evidence.
 *
 * UPLOADED:
 *   Evidence exists, but has not been independently verified.
 *
 * THIRD_PARTY_VERIFIED:
 *   Evidence has been verified by an accepted external /
 *   third-party verification source.
 *
 * KUBERLIST_VERIFIED:
 *   KuberList has completed its own verification.
 *
 * KuberList verification intentionally has the highest weight.
 */
export const VERIFICATION_WEIGHTS = {
  NONE: 0,
  UPLOADED: 40,
  THIRD_PARTY_VERIFIED: 75,
  KUBERLIST_VERIFIED: 100,
};

/*
 * ------------------------------------------------------------
 * Requirement statuses that count as "addressed"
 * ------------------------------------------------------------
 *
 * Addressed does NOT mean verified.
 *
 * An uploaded document is addressed for readiness purposes,
 * but its verification score remains below a verified document.
 */
const ADDRESSED_STATUSES = new Set(["UPLOADED", "UNDER_REVIEW", "VERIFIED"]);

/*
 * ------------------------------------------------------------
 * Helper
 * ------------------------------------------------------------
 */
function getWeight(requirement) {
  const weight = Number(requirement?.checklist_item?.weight ?? 1);

  if (!Number.isFinite(weight) || weight <= 0) {
    return 1;
  }

  return weight;
}

/*
 * ------------------------------------------------------------
 * Load a complete DD workspace
 * ------------------------------------------------------------
 */
async function loadDueDiligence(dueDiligenceId, tx = prisma) {
  return tx.dueDiligence.findUnique({
    where: {
      id: dueDiligenceId,
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
        },
      },

      requirements: {
        include: {
          checklist_item: true,

          document: {
            select: {
              id: true,
              startup_id: true,
              file_name: true,
              storage_provider: true,
              file_url: true,
              public_id: true,
              mime_type: true,
              original_file_name: true,
              storage_path: true,
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

          diligence_request: {
            select: {
              id: true,
              startup_id: true,
              investor_id: true,
              title: true,
              request_type: true,
              notes: true,
              status: true,
              requested_at: true,
              completed_at: true,
              response_document_id: true,
            },
          },
        },

        orderBy: [
          {
            checklist_item: {
              category: "asc",
            },
          },
          {
            checklist_item: {
              sort_order: "asc",
            },
          },
        ],
      },
    },
  });
}

/*
 * ------------------------------------------------------------
 * Calculate DD Readiness Score
 * ------------------------------------------------------------
 *
 * Question answered:
 *
 * "How complete is the DD process?"
 *
 * Important distinction:
 *
 * Uploaded evidence counts as addressed.
 * Verification level does NOT determine readiness by itself.
 *
 * Required / optional is respected through checklist item weight.
 *
 * NOT_APPLICABLE is excluded from the denominator.
 */
export function calculateReadinessScore(requirements = []) {
  let totalWeight = 0;
  let addressedWeight = 0;

  for (const requirement of requirements) {
    if (requirement.status === "NOT_APPLICABLE") {
      continue;
    }

    const weight = getWeight(requirement);

    totalWeight += weight;

    if (ADDRESSED_STATUSES.has(requirement.status)) {
      addressedWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return 0;
  }

  return Math.round((addressedWeight / totalWeight) * 100);
}

/*
 * ------------------------------------------------------------
 * Calculate DD Verification Score
 * ------------------------------------------------------------
 *
 * Question answered:
 *
 * "How strongly is the supplied evidence verified?"
 *
 * NONE                  = 0
 * UPLOADED              = 40
 * THIRD_PARTY_VERIFIED  = 75
 * KUBERLIST_VERIFIED    = 100
 *
 * This means two companies can have the same DD readiness,
 * while having very different verification strength.
 */
export function calculateVerificationScore(requirements = []) {
  let totalWeight = 0;
  let weightedVerification = 0;

  for (const requirement of requirements) {
    if (requirement.status === "NOT_APPLICABLE") {
      continue;
    }

    const weight = getWeight(requirement);

    const level =
      requirement.status === "VERIFIED"
        ? requirement.verification_level
        : "NONE";

    const verificationScore = VERIFICATION_WEIGHTS[level] ?? 0;

    totalWeight += weight;

    weightedVerification += verificationScore * weight;
  }

  if (totalWeight === 0) {
    return 0;
  }

  return Math.round(weightedVerification / totalWeight);
}

/*
 * ------------------------------------------------------------
 * Determine DD status
 * ------------------------------------------------------------
 */
export function calculateDueDiligenceStatus(requirements = []) {
  if (requirements.length === 0) {
    return "NOT_STARTED";
  }

  const applicableRequirements = requirements.filter(
    (requirement) => requirement.status !== "NOT_APPLICABLE",
  );

  if (applicableRequirements.length === 0) {
    return "COMPLETED";
  }

  /*
   * Completed means every applicable requirement has been
   * fully verified.
   *
   * Uploaded alone is NOT completion.
   */
  const allVerified = applicableRequirements.every(
    (requirement) =>
      requirement.status === "VERIFIED" &&
      (requirement.verification_level === "KUBERLIST_VERIFIED" ||
        requirement.verification_level === "THIRD_PARTY_VERIFIED"),
  );

  if (allVerified) {
    return "COMPLETED";
  }

  /*
   * If every required item has been addressed but some
   * verification is still pending, the workspace is ready
   * for review.
   */
  const allRequiredAddressed = applicableRequirements
    .filter((requirement) => requirement.checklist_item?.required !== false)
    .every((requirement) => ADDRESSED_STATUSES.has(requirement.status));

  if (allRequiredAddressed) {
    return "READY_FOR_REVIEW";
  }

  /*
   * If anything has been requested/uploaded/reviewed,
   * DD is underway.
   */
  const hasActivity = applicableRequirements.some(
    (requirement) => requirement.status !== "MISSING",
  );

  if (hasActivity) {
    return "IN_PROGRESS";
  }

  return "NOT_STARTED";
}

/*
 * ------------------------------------------------------------
 * Find appropriate active checklist template
 * ------------------------------------------------------------
 */
async function findTemplateForConnection(connectionId, tx = prisma) {
  const connection = await tx.connection.findUnique({
    where: {
      id: connectionId,
    },
    include: {
      listing: {
        select: {
          id: true,
          entity_type: true,
        },
      },
    },
  });

  if (!connection) {
    const error = new Error("Connection not found");

    error.statusCode = 404;

    throw error;
  }

  const templates = await tx.dDChecklistTemplate.findMany({
    where: {
      is_active: true,

      entity_type: {
        in: [connection.listing.entity_type, "BOTH"],
      },
    },

    include: {
      items: {
        orderBy: {
          sort_order: "asc",
        },
      },
    },

    orderBy: {
      created_at: "asc",
    },
  });

  if (templates.length === 0) {
    const error = new Error(
      "No active DD checklist template is available for this listing",
    );

    error.statusCode = 404;

    throw error;
  }

  return templates[0];
}

/*
 * ------------------------------------------------------------
 * Initialize DD
 * ------------------------------------------------------------
 *
 * Creates ONE DD workspace per Connection.
 *
 * Checklist items are copied into DDRequirement records.
 *
 * This is important because the checklist should be a snapshot
 * of what applied when DD started.
 */
export async function initializeDueDiligence(connectionId) {
  const dueDiligenceId = await prisma.$transaction(async (tx) => {
    const connection = await tx.connection.findUnique({
      where: {
        id: connectionId,
      },

      include: {
        listing: {
          select: {
            id: true,
            entity_type: true,
          },
        },
      },
    });

    if (!connection) {
      const error = new Error("Connection not found");

      error.statusCode = 404;

      throw error;
    }

    /*
     * DD belongs to an active investor/company relationship.
     */
    if (connection.status !== "ACTIVE") {
      const error = new Error(
        "Due diligence can only be started for an active connection",
      );

      error.statusCode = 400;

      throw error;
    }

    /*
     * Return existing workspace instead of creating duplicates.
     */
    const existing = await tx.dueDiligence.findUnique({
      where: {
        connection_id: connectionId,
      },
    });

    if (existing) {
      return existing.id;
    }

    const template = await findTemplateForConnection(connectionId, tx);

    if (!template.items.length) {
      const error = new Error("The DD checklist template contains no items");

      error.statusCode = 400;

      throw error;
    }

    const now = new Date();

    const dueDiligence = await tx.dueDiligence.create({
      data: {
        connection_id: connectionId,
        template_id: template.id,
        status: "IN_PROGRESS",
        readiness_score: 0,
        verification_score: 0,
        started_at: now,
      },
    });

    await tx.dDRequirement.createMany({
      data: template.items.map((item) => ({
        due_diligence_id: dueDiligence.id,
        checklist_item_id: item.id,
        status: "MISSING",
        verification_level: "NONE",
      })),
    });

    return dueDiligence.id;
  });

  /*
   * Load the complete workspace AFTER the transaction has
   * completed. This prevents the large nested query from
   * running against a transaction that may already have closed.
   */
  return loadDueDiligence(dueDiligenceId);
}

/*
 * ------------------------------------------------------------
 * Get DD by connection
 * ------------------------------------------------------------
 */
export async function getDueDiligenceByConnection(connectionId) {
  return prisma.dueDiligence.findUnique({
    where: {
      connection_id: connectionId,
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
        },
      },

      requirements: {
        include: {
          checklist_item: true,

          document: {
            select: {
              id: true,
              startup_id: true,
              file_name: true,
              storage_provider: true,
              file_url: true,
              public_id: true,
              mime_type: true,
              original_file_name: true,
              storage_path: true,
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

          diligence_request: {
            select: {
              id: true,
              title: true,
              request_type: true,
              notes: true,
              status: true,
              requested_at: true,
              completed_at: true,
              response_document_id: true,
            },
          },
        },

        orderBy: [
          {
            checklist_item: {
              category: "asc",
            },
          },
          {
            checklist_item: {
              sort_order: "asc",
            },
          },
        ],
      },
    },
  });
}

/*
 * ------------------------------------------------------------
 * Recalculate and persist DD scores
 * ------------------------------------------------------------
 */
export async function recalculateDueDiligence(dueDiligenceId) {
  return prisma.$transaction(async (tx) => {
    const dd = await tx.dueDiligence.findUnique({
      where: {
        id: dueDiligenceId,
      },

      include: {
        requirements: {
          include: {
            checklist_item: true,
          },
        },
      },
    });

    if (!dd) {
      const error = new Error("Due diligence workspace not found");

      error.statusCode = 404;

      throw error;
    }

    const readinessScore = calculateReadinessScore(dd.requirements);

    const verificationScore = calculateVerificationScore(dd.requirements);

    const status = calculateDueDiligenceStatus(dd.requirements);

    const updateData = {
      readiness_score: readinessScore,

      verification_score: verificationScore,

      status,
    };

    /*
     * First meaningful activity.
     */
    if (status !== "NOT_STARTED" && !dd.started_at) {
      updateData.started_at = new Date();
    }

    /*
     * Completion timestamp.
     */
    if (status === "COMPLETED" && !dd.completed_at) {
      updateData.completed_at = new Date();
    }

    /*
     * If DD is no longer completed, clear completion
     * timestamp because the current state is not complete.
     */
    if (status !== "COMPLETED" && dd.completed_at) {
      updateData.completed_at = null;
    }

    const updatedDueDiligence = await tx.dueDiligence.update({
      where: {
        id: dueDiligenceId,
      },

      data: updateData,
    });

    return updatedDueDiligence;
  });
}
/*
 * ------------------------------------------------------------
 * Update a requirement's workflow status
 * ------------------------------------------------------------
 */
export async function updateRequirementStatus(requirementId, status, notes) {
  const allowedStatuses = [
    "MISSING",
    "REQUESTED",
    "UPLOADED",
    "UNDER_REVIEW",
    "VERIFIED",
    "NOT_APPLICABLE",
  ];

  if (!allowedStatuses.includes(status)) {
    const error = new Error("Invalid DD requirement status");

    error.statusCode = 400;

    throw error;
  }

  const requirement = await prisma.dDRequirement.findUnique({
    where: {
      id: requirementId,
    },
  });

  if (!requirement) {
    const error = new Error("DD requirement not found");

    error.statusCode = 404;

    throw error;
  }

  /*
   * VERIFIED cannot be created merely by changing the status.
   *
   * A real verification level is required.
   */
  if (
    status === "VERIFIED" &&
    requirement.verification_level !== "THIRD_PARTY_VERIFIED" &&
    requirement.verification_level !== "KUBERLIST_VERIFIED"
  ) {
    const error = new Error(
      "A requirement cannot be marked VERIFIED without third-party or KuberList verification",
    );

    error.statusCode = 400;

    throw error;
  }

  const updateData = {
    status,

    ...(notes !== undefined ? { notes } : {}),
  };

  if (status === "MISSING" || status === "REQUESTED") {
    updateData.verification_level = "NONE";
    updateData.document_id = null;
    updateData.verified_by = null;
    updateData.verified_at = null;
    updateData.verification_notes = null;
    updateData.completed_at = null;
  }

  if (status === "NOT_APPLICABLE") {
    updateData.verification_level = "NONE";
    updateData.document_id = null;
    updateData.verified_by = null;
    updateData.verified_at = null;
    updateData.verification_notes = null;
    updateData.completed_at = null;
  }

  if (status === "UPLOADED" || status === "UNDER_REVIEW") {
    updateData.verification_level = "UPLOADED";
    updateData.verified_by = null;
    updateData.verified_at = null;
    updateData.verification_notes = null;
    updateData.completed_at = null;
  }

  await prisma.dDRequirement.update({
    where: {
      id: requirementId,
    },

    data: updateData,
  });

  return recalculateDueDiligence(requirement.due_diligence_id);
}

/*
 * ------------------------------------------------------------
 * Attach document as DD evidence
 * ------------------------------------------------------------
 *
 * This does not itself grant access to the document.
 *
 * Authorization remains the responsibility of the controller
 * and existing connection/document middleware.
 */
export async function attachDocumentToRequirement(requirementId, documentId) {
  await prisma.$transaction(async (tx) => {
    const requirement = await tx.dDRequirement.findUnique({
      where: {
        id: requirementId,
      },

      include: {
        due_diligence: {
          include: {
            connection: {
              select: {
                listing_id: true,
              },
            },
          },
        },
      },
    });

    if (!requirement) {
      const error = new Error("DD requirement not found");

      error.statusCode = 404;

      throw error;
    }

    const document = await tx.document.findUnique({
      where: {
        id: documentId,
      },

      select: {
        id: true,
        startup_id: true,
        verification_status: true,
      },
    });

    if (!document) {
      const error = new Error("Document not found");

      error.statusCode = 404;

      throw error;
    }

    /*
     * Evidence must belong to the company associated
     * with this DD connection.
     */
    if (
      document.startup_id !== requirement.due_diligence.connection.listing_id
    ) {
      const error = new Error(
        "This document does not belong to the company in this DD process",
      );

      error.statusCode = 403;

      throw error;
    }

    /*
     * Map Document verification status to DD verification level.
     */
    let verificationLevel = "UPLOADED";

    if (document.verification_status === "THIRD_PARTY_VERIFIED") {
      verificationLevel = "THIRD_PARTY_VERIFIED";
    }

    if (document.verification_status === "KUBERLIST_REVIEWED") {
      verificationLevel = "KUBERLIST_VERIFIED";
    }

    const verified =
      verificationLevel === "THIRD_PARTY_VERIFIED" ||
      verificationLevel === "KUBERLIST_VERIFIED";

    await tx.dDRequirement.update({
      where: {
        id: requirementId,
      },

      data: {
        document_id: document.id,
        verification_level: verificationLevel,
        status: verified ? "VERIFIED" : "UPLOADED",
        completed_at: verified ? new Date() : null,
      },
    });

    const requirements = await tx.dDRequirement.findMany({
      where: {
        due_diligence_id: requirement.due_diligence_id,
      },

      include: {
        checklist_item: true,
      },
    });

    const readinessScore = calculateReadinessScore(requirements);

    const verificationScore = calculateVerificationScore(requirements);

    const status = calculateDueDiligenceStatus(requirements);

    await tx.dueDiligence.update({
      where: {
        id: requirement.due_diligence_id,
      },

      data: {
        readiness_score: readinessScore,
        verification_score: verificationScore,
        status,
      },
    });

    /*
     * The transaction ends here.
     *
     * The updated requirement is loaded after the transaction
     * has committed, avoiding a large nested read inside the
     * interactive transaction.
     */
  });

  /*
   * Load the updated requirement after the transaction closes.
   */
  return prisma.dDRequirement.findUnique({
    where: {
      id: requirementId,
    },

    include: {
      checklist_item: true,
      document: true,
      diligence_request: true,
    },
  });
}

/*
 * ------------------------------------------------------------
 * Explicit verification operation
 * ------------------------------------------------------------
 *
 * IMPORTANT:
 *
 * This is the operation that should be called only after the
 * appropriate authorization / verification workflow has been
 * completed.
 *
 * Uploading a file never automatically makes it KuberList
 * verified.
 */
export async function verifyRequirement(
  requirementId,
  verificationLevel,
  verifiedBy,
  verificationNotes = null,
) {
  const allowedLevels = [
    "NONE",
    "UPLOADED",
    "THIRD_PARTY_VERIFIED",
    "KUBERLIST_VERIFIED",
  ];

  if (!allowedLevels.includes(verificationLevel)) {
    const error = new Error("Invalid DD verification level");

    error.statusCode = 400;

    throw error;
  }

  const requirement = await prisma.dDRequirement.findUnique({
    where: {
      id: requirementId,
    },
    include: {
      due_diligence: {
        include: {
          connection: {
            select: {
              listing_id: true,
            },
          },
        },
      },
    },
  });

  if (!requirement) {
    const error = new Error("DD requirement not found");

    error.statusCode = 404;

    throw error;
  }

  const verified =
    verificationLevel === "THIRD_PARTY_VERIFIED" ||
    verificationLevel === "KUBERLIST_VERIFIED";

  /*
   * A verified requirement MUST have valid evidence.
   */
  if (verified) {
    if (!requirement.document_id) {
      const error = new Error(
        "A requirement cannot be verified without evidence",
      );

      error.statusCode = 400;

      throw error;
    }

    const document = await prisma.document.findUnique({
      where: {
        id: requirement.document_id,
      },
      select: {
        id: true,
        startup_id: true,
      },
    });

    if (!document) {
      const error = new Error(
        "The evidence document attached to this requirement no longer exists",
      );

      error.statusCode = 400;

      throw error;
    }

    if (
      document.startup_id !== requirement.due_diligence.connection.listing_id
    ) {
      const error = new Error(
        "The evidence document does not belong to the company in this DD process",
      );

      error.statusCode = 400;

      throw error;
    }
  }

  await prisma.dDRequirement.update({
    where: {
      id: requirementId,
    },

    data: {
      verification_level: verificationLevel,

      status: verified
        ? "VERIFIED"
        : verificationLevel === "UPLOADED"
          ? "UPLOADED"
          : "MISSING",

      verified_by: verified ? verifiedBy : null,

      verified_at: verified ? new Date() : null,

      verification_notes: verificationNotes,

      completed_at: verified ? new Date() : null,
    },
  });

  return recalculateDueDiligence(requirement.due_diligence_id);
}

/*
 * ------------------------------------------------------------
 * Category breakdown
 * ------------------------------------------------------------
 *
 * This will power the future DD workspace.
 *
 * Example:
 *
 * Corporate     100%
 * Financial      72%
 * Legal          40%
 * Tax            80%
 */
export async function getCategoryBreakdown(dueDiligenceId) {
  const dd = await prisma.dueDiligence.findUnique({
    where: {
      id: dueDiligenceId,
    },

    include: {
      requirements: {
        include: {
          checklist_item: true,
        },
      },
    },
  });

  if (!dd) {
    const error = new Error("Due diligence workspace not found");

    error.statusCode = 404;

    throw error;
  }

  const categories = {};

  for (const requirement of dd.requirements) {
    if (requirement.status === "NOT_APPLICABLE") {
      continue;
    }

    const category = requirement.checklist_item?.category || "OTHER";

    if (!categories[category]) {
      categories[category] = {
        total_weight: 0,
        addressed_weight: 0,
        verification_weight: 0,
        readiness_score: 0,
        verification_score: 0,
      };
    }

    const weight = getWeight(requirement);

    const verificationScore =
      requirement.status === "VERIFIED"
        ? (VERIFICATION_WEIGHTS[requirement.verification_level] ?? 0)
        : 0;

    categories[category].total_weight += weight;

    if (ADDRESSED_STATUSES.has(requirement.status)) {
      categories[category].addressed_weight += weight;
    }

    categories[category].verification_weight += verificationScore * weight;
  }

  for (const category of Object.values(categories)) {
    if (category.total_weight > 0) {
      category.readiness_score = Math.round(
        (category.addressed_weight / category.total_weight) * 100,
      );

      category.verification_score = Math.round(
        category.verification_weight / category.total_weight,
      );
    }
  }

  return categories;
}

/*
 * ------------------------------------------------------------
 * Summary for DD dashboard
 * ------------------------------------------------------------
 */
export async function getDueDiligenceSummary(dueDiligenceId) {
  const dd = await prisma.dueDiligence.findUnique({
    where: {
      id: dueDiligenceId,
    },

    include: {
      requirements: {
        include: {
          checklist_item: true,
        },
      },
    },
  });

  if (!dd) {
    const error = new Error("Due diligence workspace not found");

    error.statusCode = 404;

    throw error;
  }

  const applicable = dd.requirements.filter(
    (requirement) => requirement.status !== "NOT_APPLICABLE",
  );

  const required = applicable.filter(
    (requirement) => requirement.checklist_item?.required !== false,
  );

  const addressed = applicable.filter((requirement) =>
    ADDRESSED_STATUSES.has(requirement.status),
  );

  const verified = applicable.filter(
    (requirement) => requirement.status === "VERIFIED",
  );

  const uploaded = applicable.filter(
    (requirement) => requirement.verification_level === "UPLOADED",
  );

  const thirdPartyVerified = applicable.filter(
    (requirement) =>
      requirement.status === "VERIFIED" &&
      requirement.verification_level === "THIRD_PARTY_VERIFIED",
  );

  const kuberListVerified = applicable.filter(
    (requirement) =>
      requirement.status === "VERIFIED" &&
      requirement.verification_level === "KUBERLIST_VERIFIED",
  );

  const missing = applicable.filter(
    (requirement) => requirement.status === "MISSING",
  );

  const requested = applicable.filter(
    (requirement) => requirement.status === "REQUESTED",
  );

  return {
    id: dd.id,

    status: dd.status,

    readiness_score: dd.readiness_score,

    verification_score: dd.verification_score,

    total_requirements: applicable.length,

    required_requirements: required.length,

    addressed_requirements: addressed.length,

    verified_requirements: verified.length,

    missing_requirements: missing.length,

    requested_requirements: requested.length,

    uploaded_requirements: uploaded.length,

    third_party_verified_requirements: thirdPartyVerified.length,

    kuberlist_verified_requirements: kuberListVerified.length,

    not_applicable_requirements: dd.requirements.length - applicable.length,

    started_at: dd.started_at,

    completed_at: dd.completed_at,
  };
}
