import React, { useMemo, useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle2,
  Circle,
  Clock3,
  ShieldCheck,
  X,
} from "lucide-react";

const CATEGORY_LABELS = {
  TAX: "Tax",
  LEGAL: "Legal",
  COMMERCIAL: "Commercial",
  BUSINESS: "Business",
  FINANCIAL: "Financial",
  CORPORATE: "Corporate",
  OTHER: "Other",
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "MISSING", label: "Missing" },
  { value: "REQUESTED", label: "Requested" },
  { value: "UPLOADED", label: "Uploaded" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "NOT_APPLICABLE", label: "Not Applicable" },
];

const TYPE_OPTIONS = [
  { value: "ALL", label: "All Types" },
  { value: "REQUIRED", label: "Required" },
  { value: "OPTIONAL", label: "Optional" },
];

function formatStatus(status) {
  return String(status || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatVerification(level) {
  if (!level || level === "NONE") return "Not Verified";

  return String(level)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClasses(status) {
  switch (status) {
    case "VERIFIED":
      return "bg-olive/10 text-oliveD border-olive/20";

    case "UNDER_REVIEW":
      return "bg-gold/10 text-goldD border-gold/20";

    case "UPLOADED":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "REQUESTED":
      return "bg-purple-50 text-purple-700 border-purple-100";

    case "NOT_APPLICABLE":
      return "bg-gray-100 text-gray-600 border-gray-200";

    default:
      return "bg-red-50 text-red-600 border-red-100";
  }
}

function getVerificationClasses(level) {
  switch (level) {
    case "KUBERLIST_VERIFIED":
      return "text-oliveD";

    case "THIRD_PARTY_VERIFIED":
      return "text-goldD";

    case "UPLOADED":
      return "text-blue-700";

    default:
      return "text-muted";
  }
}

function StatusIcon({ status }) {
  if (status === "VERIFIED") {
    return <CheckCircle2 size={17} className="text-oliveD" />;
  }

  if (status === "UNDER_REVIEW") {
    return <Clock3 size={17} className="text-goldD" />;
  }

  if (status === "UPLOADED") {
    return <FileText size={17} className="text-blue-600" />;
  }

  return <Circle size={17} className="text-gray-300" />;
}

function RequirementRow({ requirement, onSelect }) {
  const item = requirement.checklist_item || {};
  const status = requirement.status || "MISSING";
  const verification = requirement.verification_level || "NONE";

  return (
    <button
      type="button"
      onClick={() => onSelect(requirement)}
      className="group w-full border-b border-border bg-white px-5 py-4 text-left transition hover:bg-[#FBFCFA]"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">
          <StatusIcon status={status} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-navy">
              {item.title || "Untitled Requirement"}
            </h3>

            {item.required ? (
              <span className="rounded-full border border-navy/10 bg-navy/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
                Required
              </span>
            ) : (
              <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                If Applicable
              </span>
            )}
          </div>

          {item.description && (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
              {item.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span
              className={`rounded-full border px-2.5 py-1 font-semibold ${getStatusClasses(
                status,
              )}`}
            >
              {formatStatus(status)}
            </span>

            <span
              className={`flex items-center gap-1.5 font-medium ${getVerificationClasses(
                verification,
              )}`}
            >
              <ShieldCheck size={14} />
              {formatVerification(verification)}
            </span>

            {requirement.document ? (
              <span className="flex items-center gap-1.5 text-muted">
                <FileText size={14} />
                Evidence attached
              </span>
            ) : (
              <span className="text-dim">No evidence</span>
            )}

            {item.weight != null && (
              <span className="text-dim">Weight {item.weight}</span>
            )}
          </div>
        </div>

        <ChevronRight
          size={18}
          className="mt-1 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-navy"
        />
      </div>
    </button>
  );
}

function DetailDrawer({
  requirement,
  onClose,
  isSeeker,
  onRequestDocument,
  requestingRequirementId,
}) {
  if (!requirement) return null;

  const item = requirement.checklist_item || {};
  const document = requirement.document;
  const verification = requirement.verification_level || "NONE";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close requirement details"
        onClick={onClose}
        className="absolute inset-0 bg-navy/20 backdrop-blur-[2px]"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-modal">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="pr-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {CATEGORY_LABELS[item.category] || item.category || "Other"}
              </span>

              {item.required ? (
                <span className="rounded-full bg-navy/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy">
                  Required
                </span>
              ) : (
                <span className="rounded-full bg-bg px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  If Applicable
                </span>
              )}
            </div>

            <h2 className="font-display text-3xl font-semibold leading-tight text-navy">
              {item.title || "Requirement Details"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted transition hover:bg-bg hover:text-navy"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {item.description && (
            <section className="mb-7">
              <p className="text-sm leading-6 text-muted">{item.description}</p>
            </section>
          )}

          <section className="mb-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                  requirement.status,
                )}`}
              >
                {formatStatus(requirement.status)}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Verification
              </p>

              <p
                className={`mt-2 text-sm font-semibold ${getVerificationClasses(
                  verification,
                )}`}
              >
                {formatVerification(verification)}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Applicability
              </p>

              <p className="mt-2 text-sm font-semibold text-navy">
                {item.applicability === "CORE"
                  ? "Core Requirement"
                  : "If Applicable"}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Weight
              </p>

              <p className="mt-2 text-sm font-semibold text-navy">
                {item.weight ?? "—"}
              </p>
            </div>
          </section>

          <section className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-navy">
                Evidence
              </h3>
            </div>

            {document ? (
              <div className="rounded-xl border border-border bg-bg p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-white p-2 text-navy shadow-sm">
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">
                      {document.original_file_name ||
                        document.file_name ||
                        "Evidence document"}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      Uploaded {formatDate(document.uploaded_at)}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider">
                      <span className="rounded-full bg-white px-2 py-1 text-muted">
                        {document.document_type || "Document"}
                      </span>

                      <span className="rounded-full bg-white px-2 py-1 text-muted">
                        {document.verification_status || "Uploaded"}
                      </span>
                    </div>
                  </div>
                </div>

                {document.file_url && (
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-navy underline-offset-4 hover:underline"
                  >
                    Open evidence
                    <ChevronRight size={14} />
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-bg px-4 py-5 text-sm text-muted">
                No evidence has been attached to this requirement.
              </div>
            )}
          </section>
          {!isSeeker &&
            requirement.status === "MISSING" &&
            !requirement.diligence_request && (
              <div className="mt-5 rounded-xl border border-[#E2E4DF] bg-[#F8F9F6] p-4">
                <p className="text-sm font-medium text-[#111827]">
                  Document required
                </p>

                <p className="mt-1 text-sm text-[#6B7280]">
                  Request the capital seeker to provide the document or evidence
                  for this checklist item.
                </p>

                <button
                  type="button"
                  onClick={() => onRequestDocument(requirement)}
                  disabled={requestingRequirementId === requirement.id}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#022440] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#011A30] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {requestingRequirementId === requirement.id
                    ? "Requesting..."
                    : "Request Document"}
                </button>
              </div>
            )}

          {!isSeeker &&
            requirement.status === "REQUESTED" &&
            requirement.diligence_request && (
              <div className="mt-5 rounded-xl border border-[#E2E4DF] bg-[#F8F9F6] p-4">
                <p className="text-sm font-medium text-[#111827]">
                  Document Requested
                </p>

                <p className="mt-1 text-sm text-[#6B7280]">
                  The capital seeker has been asked to provide this document.
                </p>
              </div>
            )}
          {requirement.verification_notes && (
            <section className="mb-7">
              <h3 className="mb-3 font-display text-xl font-semibold text-navy">
                Verification Notes
              </h3>

              <div className="rounded-xl border border-border bg-bg px-4 py-4 text-sm leading-6 text-muted">
                {requirement.verification_notes}
              </div>
            </section>
          )}

          {requirement.notes && (
            <section className="mb-7">
              <h3 className="mb-3 font-display text-xl font-semibold text-navy">
                Notes
              </h3>

              <div className="rounded-xl border border-border bg-bg px-4 py-4 text-sm leading-6 text-muted">
                {requirement.notes}
              </div>
            </section>
          )}

          {requirement.verified_at && (
            <section>
              <h3 className="mb-3 font-display text-xl font-semibold text-navy">
                Verification History
              </h3>

              <div className="rounded-xl border border-border bg-bg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-oliveD" />

                  <div>
                    <p className="text-sm font-semibold text-navy">Verified</p>

                    <p className="mt-1 text-xs text-muted">
                      {formatDate(requirement.verified_at)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function DueDiligenceChecklist({
  requirements = [],
  loading = false,
  isSeeker = false,
  onRequestDocument,
  requestingRequirementId = null,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const safeRequirements = Array.isArray(requirements) ? requirements : [];

  const filteredRequirements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return safeRequirements
      .filter((requirement) => {
        const item = requirement.checklist_item || {};

        const matchesSearch =
          !query ||
          String(item.title || "")
            .toLowerCase()
            .includes(query) ||
          String(item.description || "")
            .toLowerCase()
            .includes(query);

        const matchesCategory =
          category === "ALL" || item.category === category;

        const matchesStatus = status === "ALL" || requirement.status === status;

        const matchesType =
          type === "ALL" ||
          (type === "REQUIRED" && item.required === true) ||
          (type === "OPTIONAL" && item.required !== true);

        return matchesSearch && matchesCategory && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const categoryA = a.checklist_item?.category || "";
        const categoryB = b.checklist_item?.category || "";

        if (categoryA !== categoryB) {
          return categoryA.localeCompare(categoryB);
        }

        return (
          Number(a.checklist_item?.sort_order || 0) -
          Number(b.checklist_item?.sort_order || 0)
        );
      });
  }, [safeRequirements, search, category, status, type]);

  const groupedRequirements = useMemo(() => {
    return filteredRequirements.reduce((groups, requirement) => {
      const key = requirement.checklist_item?.category || "OTHER";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(requirement);
      return groups;
    }, {});
  }, [filteredRequirements]);

  const verifiedCount = safeRequirements.filter(
    (requirement) => requirement.status === "VERIFIED",
  ).length;

  const addressedCount = safeRequirements.filter((requirement) =>
    ["UPLOADED", "UNDER_REVIEW", "VERIFIED"].includes(requirement.status),
  ).length;

  const categoryOptions = useMemo(() => {
    const categories = [
      ...new Set(
        safeRequirements
          .map((requirement) => requirement.checklist_item?.category)
          .filter(Boolean),
      ),
    ];

    return categories.sort();
  }, [safeRequirements]);

  function toggleCategory(categoryName) {
    setCollapsedCategories((current) => ({
      ...current,
      [categoryName]: !current[categoryName],
    }));
  }

  return (
    <div className="relative">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Due Diligence
          </p>

          <h1 className="font-display text-3xl font-semibold text-navy">
            Checklist
          </h1>

          <p className="mt-1 text-sm text-muted">
            Review each diligence requirement, its status, and supporting
            evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Addressed
            </p>

            <p className="mt-1 text-lg font-semibold text-navy">
              {addressedCount}
              <span className="text-sm font-normal text-muted">
                {" "}
                / {safeRequirements.length}
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-olive/20 bg-olive/5 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-oliveD">
              Verified
            </p>

            <p className="mt-1 text-lg font-semibold text-oliveD">
              {verifiedCount}
              <span className="text-sm font-normal text-muted">
                {" "}
                / {safeRequirements.length}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dim"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search requirements..."
              className="h-11 w-full rounded-xl border border-border bg-bg pl-10 pr-4 text-sm text-navy outline-none transition placeholder:text-dim focus:border-navy/30 focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <FilterSelect
              value={category}
              onChange={setCategory}
              options={[
                { value: "ALL", label: "All Categories" },
                ...categoryOptions.map((value) => ({
                  value,
                  label: CATEGORY_LABELS[value] || value,
                })),
              ]}
            />

            <FilterSelect
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />

            <FilterSelect
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS}
            />
          </div>
        </div>

        {(search ||
          category !== "ALL" ||
          status !== "ALL" ||
          type !== "ALL") && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-muted">
              Showing {filteredRequirements.length} of {safeRequirements.length}{" "}
              requirements
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("ALL");
                setStatus("ALL");
                setType("ALL");
              }}
              className="text-xs font-semibold text-navy hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center shadow-card">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-border border-t-navy" />
          <p className="mt-3 text-sm text-muted">
            Loading diligence checklist...
          </p>
        </div>
      ) : filteredRequirements.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center shadow-card">
          <Search size={24} className="mx-auto text-dim" />

          <h3 className="mt-3 font-display text-xl font-semibold text-navy">
            No requirements found
          </h3>

          <p className="mt-1 text-sm text-muted">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedRequirements).map(
            ([categoryName, categoryRequirements]) => {
              const collapsed = collapsedCategories[categoryName];

              const categoryVerified = categoryRequirements.filter(
                (requirement) => requirement.status === "VERIFIED",
              ).length;

              return (
                <section
                  key={categoryName}
                  className="overflow-hidden rounded-2xl border border-border bg-white shadow-card"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(categoryName)}
                    className="flex w-full items-center justify-between border-b border-border bg-[#FBFCFA] px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {collapsed ? (
                        <ChevronRight size={18} className="text-muted" />
                      ) : (
                        <ChevronDown size={18} className="text-muted" />
                      )}

                      <div>
                        <h2 className="font-display text-xl font-semibold text-navy">
                          {CATEGORY_LABELS[categoryName] || categoryName}
                        </h2>

                        <p className="mt-0.5 text-xs text-muted">
                          {categoryRequirements.length} requirement
                          {categoryRequirements.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-navy">
                        {categoryVerified} / {categoryRequirements.length}
                      </p>

                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Verified
                      </p>
                    </div>
                  </button>

                  {!collapsed &&
                    categoryRequirements.map((requirement) => (
                      <RequirementRow
                        key={requirement.id}
                        requirement={requirement}
                        onSelect={setSelectedRequirement}
                      />
                    ))}
                </section>
              );
            },
          )}
        </div>
      )}

      <DetailDrawer
        requirement={selectedRequirement}
        onClose={() => setSelectedRequirement(null)}
        isSeeker={isSeeker}
        onRequestDocument={onRequestDocument}
        requestingRequirementId={requestingRequirementId}
      />
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative min-w-[160px]">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-bg px-3 pr-9 text-sm text-navy outline-none transition focus:border-navy/30 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
      />
    </div>
  );
}
