import React, { useMemo, useState } from "react";
import {
  Search,
  FileText,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Clock3,
  Eye,
  ChevronRight,
  X,
} from "lucide-react";

const CATEGORY_LABELS = {
  LEGAL: "Legal",
  BUSINESS: "Business",
  OWNERSHIP: "Ownership",
  FINANCIAL: "Financial",
  CORPORATE: "Corporate",
  TAX: "Tax",
  COMMERCIAL: "Commercial",
  OTHER: "Other",
};

function formatStatus(value) {
  if (!value) return "Unknown";

  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function formatFileSize(bytes) {
  if (!bytes || Number(bytes) <= 0) return "—";

  const size = Number(bytes);

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getVerificationLabel(level) {
  switch (level) {
    case "KUBERLIST_VERIFIED":
      return "KuberList Verified";

    case "THIRD_PARTY_VERIFIED":
      return "Third-Party Verified";

    case "UPLOADED":
      return "Uploaded";

    default:
      return "Not Verified";
  }
}

function getVerificationClasses(level) {
  switch (level) {
    case "KUBERLIST_VERIFIED":
      return "border-olive/20 bg-olive/10 text-oliveD";

    case "THIRD_PARTY_VERIFIED":
      return "border-gold/20 bg-gold/10 text-goldD";

    case "UPLOADED":
      return "border-blue-100 bg-blue-50 text-blue-700";

    default:
      return "border-border bg-bg text-muted";
  }
}

function VerificationIcon({ level }) {
  if (level === "KUBERLIST_VERIFIED") {
    return <CheckCircle2 size={15} />;
  }

  if (level === "THIRD_PARTY_VERIFIED") {
    return <ShieldCheck size={15} />;
  }

  if (level === "UPLOADED") {
    return <Clock3 size={15} />;
  }

  return <FileText size={15} />;
}

function DocumentCard({ document, requirement, onOpen }) {
  const item = requirement?.checklist_item || {};

  const verificationLevel =
    requirement?.verification_level ||
    (document.verification_status === "THIRD_PARTY_VERIFIED"
      ? "THIRD_PARTY_VERIFIED"
      : document.verification_status === "KUBERLIST_REVIEWED"
        ? "KUBERLIST_VERIFIED"
        : document.verification_status === "UPLOADED"
          ? "UPLOADED"
          : "NONE");

  return (
    <button
      type="button"
      onClick={() => onOpen(document, requirement)}
      className="group w-full rounded-2xl border border-border bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-gold/30 hover:shadow-gold"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-goldD">
          <FileText size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg font-semibold text-navy">
                {document.original_file_name ||
                  document.file_name ||
                  "Untitled Document"}
              </h3>

              <p className="mt-1 text-xs text-muted">
                {item.title || "DD Evidence"}
              </p>
            </div>

            <ChevronRight
              size={18}
              className="mt-1 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-navy"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-navy/10 bg-navy/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy">
              {CATEGORY_LABELS[item.category] || item.category || "Other"}
            </span>

            <span className="rounded-full border border-border bg-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {formatStatus(document.document_type)}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${getVerificationClasses(
                verificationLevel,
              )}`}
            >
              <VerificationIcon level={verificationLevel} />
              {getVerificationLabel(verificationLevel)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span>
              Uploaded{" "}
              <span className="font-medium text-text">
                {formatDate(document.uploaded_at)}
              </span>
            </span>

            <span>
              Size{" "}
              <span className="font-medium text-text">
                {formatFileSize(document.file_size)}
              </span>
            </span>

            {document.mime_type && (
              <span className="font-mono text-[10px] text-dim">
                {document.mime_type}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function DocumentDrawer({ document, requirement, onClose }) {
  if (!document) return null;

  const item = requirement?.checklist_item || {};

  const verificationLevel =
    requirement?.verification_level ||
    (document.verification_status === "THIRD_PARTY_VERIFIED"
      ? "THIRD_PARTY_VERIFIED"
      : document.verification_status === "KUBERLIST_REVIEWED"
        ? "KUBERLIST_VERIFIED"
        : document.verification_status === "UPLOADED"
          ? "UPLOADED"
          : "NONE");

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close document details"
        onClick={onClose}
        className="absolute inset-0 bg-navy/20 backdrop-blur-[2px]"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-modal">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="pr-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              DD Evidence
            </p>

            <h2 className="break-words font-display text-2xl font-semibold leading-tight text-navy">
              {document.original_file_name || document.file_name || "Document"}
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
          <section className="mb-7 rounded-2xl border border-border bg-bg p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-navy shadow-sm">
                <FileText size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">
                  Supporting Requirement
                </p>

                <p className="mt-1 text-sm text-muted">
                  {item.title || "DD Requirement"}
                </p>
              </div>
            </div>
          </section>

          <section className="mb-7">
            <h3 className="mb-3 font-display text-xl font-semibold text-navy">
              Verification
            </h3>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${getVerificationClasses(
                verificationLevel,
              )}`}
            >
              <VerificationIcon level={verificationLevel} />
              {getVerificationLabel(verificationLevel)}
            </div>

            {document.verification_notes && (
              <div className="mt-4 rounded-xl border border-border bg-bg p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Verification Notes
                </p>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {document.verification_notes}
                </p>
              </div>
            )}
          </section>

          <section className="mb-7">
            <h3 className="mb-3 font-display text-xl font-semibold text-navy">
              Document Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <DetailItem
                label="Document Type"
                value={formatStatus(document.document_type)}
              />

              <DetailItem
                label="Visibility"
                value={formatStatus(document.visibility)}
              />

              <DetailItem
                label="Uploaded"
                value={formatDate(document.uploaded_at)}
              />

              <DetailItem
                label="File Size"
                value={formatFileSize(document.file_size)}
              />

              <DetailItem
                label="Storage"
                value={formatStatus(document.storage_provider)}
              />

              <DetailItem label="MIME Type" value={document.mime_type || "—"} />
            </div>
          </section>

          {document.verified_at && (
            <section className="mb-7">
              <h3 className="mb-3 font-display text-xl font-semibold text-navy">
                Verification Date
              </h3>

              <div className="rounded-xl border border-border bg-bg p-4 text-sm text-muted">
                {formatDate(document.verified_at)}
              </div>
            </section>
          )}

          {document.file_url && (
            <a
              href={document.file_url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full justify-center"
            >
              <ExternalLink size={16} />
              Open Document
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-navy">
        {value}
      </p>
    </div>
  );
}

export default function DueDiligenceDocuments({
  requirements = [],
  loading = false,
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [verification, setVerification] = useState("ALL");
  const [selected, setSelected] = useState(null);

  const documents = useMemo(() => {
    const result = [];

    for (const requirement of Array.isArray(requirements) ? requirements : []) {
      if (!requirement?.document) continue;

      result.push({
        document: requirement.document,
        requirement,
      });
    }

    return result;
  }, [requirements]);

  const categoryOptions = useMemo(() => {
    return [
      ...new Set(
        documents
          .map(({ requirement }) => requirement?.checklist_item?.category)
          .filter(Boolean),
      ),
    ].sort();
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter(({ document, requirement }) => {
      const item = requirement?.checklist_item || {};

      const level =
        requirement?.verification_level ||
        (document.verification_status === "THIRD_PARTY_VERIFIED"
          ? "THIRD_PARTY_VERIFIED"
          : document.verification_status === "KUBERLIST_REVIEWED"
            ? "KUBERLIST_VERIFIED"
            : document.verification_status === "UPLOADED"
              ? "UPLOADED"
              : "NONE");

      const matchesSearch =
        !query ||
        String(document.original_file_name || "")
          .toLowerCase()
          .includes(query) ||
        String(document.file_name || "")
          .toLowerCase()
          .includes(query) ||
        String(item.title || "")
          .toLowerCase()
          .includes(query);

      const matchesCategory = category === "ALL" || item.category === category;

      const matchesVerification =
        verification === "ALL" || level === verification;

      return matchesSearch && matchesCategory && matchesVerification;
    });
  }, [documents, search, category, verification]);

  const kuberlistVerified = documents.filter(
    ({ requirement }) =>
      requirement?.verification_level === "KUBERLIST_VERIFIED",
  ).length;

  const thirdPartyVerified = documents.filter(
    ({ requirement }) =>
      requirement?.verification_level === "THIRD_PARTY_VERIFIED",
  ).length;

  const uploaded = documents.filter(
    ({ requirement }) => requirement?.verification_level === "UPLOADED",
  ).length;

  return (
    <div className="relative">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Due Diligence
          </p>

          <h1 className="font-display text-3xl font-semibold text-navy">
            Documents
          </h1>

          <p className="mt-1 text-sm text-muted">
            Evidence documents attached to the diligence checklist.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SummaryBox label="Documents" value={documents.length} />
          <SummaryBox
            label="KuberList"
            value={kuberlistVerified}
            tone="olive"
          />
          <SummaryBox
            label="Third Party"
            value={thirdPartyVerified}
            tone="gold"
          />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dim"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents or requirements..."
              className="h-11 w-full rounded-xl border border-border bg-bg pl-10 pr-4 text-sm text-navy outline-none transition placeholder:text-dim focus:border-navy/30 focus:bg-white"
            />
          </div>

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
            value={verification}
            onChange={setVerification}
            options={[
              { value: "ALL", label: "All Verification" },
              {
                value: "KUBERLIST_VERIFIED",
                label: "KuberList Verified",
              },
              {
                value: "THIRD_PARTY_VERIFIED",
                label: "Third-Party Verified",
              },
              {
                value: "UPLOADED",
                label: "Uploaded",
              },
            ]}
          />
        </div>

        {(search || category !== "ALL" || verification !== "ALL") && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-muted">
              Showing {filteredDocuments.length} of {documents.length} documents
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("ALL");
                setVerification("ALL");
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

          <p className="mt-3 text-sm text-muted">Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center shadow-card">
          <Eye size={25} className="mx-auto text-dim" />

          <h3 className="mt-3 font-display text-xl font-semibold text-navy">
            No DD documents found
          </h3>

          <p className="mt-1 text-sm text-muted">
            No evidence documents match the current filters.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Evidence Library
            </p>

            <p className="text-xs text-dim">
              {uploaded} uploaded · {thirdPartyVerified} third-party verified ·{" "}
              {kuberlistVerified} KuberList verified
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredDocuments.map(({ document, requirement }) => (
              <DocumentCard
                key={`${document.id}-${requirement.id}`}
                document={document}
                requirement={requirement}
                onOpen={(selectedDocument, selectedRequirement) =>
                  setSelected({
                    document: selectedDocument,
                    requirement: selectedRequirement,
                  })
                }
              />
            ))}
          </div>
        </>
      )}

      <DocumentDrawer
        document={selected?.document}
        requirement={selected?.requirement}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function SummaryBox({ label, value, tone = "navy" }) {
  const classes = {
    navy: "border-border bg-white text-navy",
    gold: "border-gold/20 bg-gold/5 text-goldD",
    olive: "border-olive/20 bg-olive/5 text-oliveD",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 ${classes[tone]}`}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative min-w-[180px]">
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

      <ChevronRight
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted"
      />
    </div>
  );
}
