import React from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ShieldCheck,
  Send,
} from "lucide-react";

function formatRequestStatus(status) {
  if (status === "UPLOADED") return "Submitted";
  if (status === "RESPONDED") return "Responded";

  return String(status || "")
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

function statusClasses(status) {
  switch (status) {
    case "REQUESTED":
      return "border-gold/20 bg-gold/10 text-goldD";

    case "UPLOADED":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "RESPONDED":
      return "border-blue-100 bg-blue-50 text-blue-700";

    case "COMPLETED":
      return "border-olive/20 bg-olive/10 text-oliveD";

    default:
      return "border-border bg-bg text-muted";
  }
}

function StatusIcon({ status }) {
  if (status === "COMPLETED") {
    return <CheckCircle2 size={15} />;
  }

  if (status === "UPLOADED" || status === "RESPONDED") {
    return <FileText size={15} />;
  }

  return <Clock3 size={15} />;
}

function VerificationBadge({ status }) {
  if (!status) return null;

  let classes = "bg-bg text-muted border-border";

  if (status === "KUBERLIST_REVIEWED") {
    classes = "bg-olive/10 text-oliveD border-olive/20";
  } else if (status === "THIRD_PARTY_VERIFIED") {
    classes = "bg-gold/10 text-goldD border-gold/20";
  } else if (status === "UPLOADED") {
    classes = "bg-blue-50 text-blue-700 border-blue-100";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${classes}`}
    >
      <ShieldCheck size={13} />
      {String(status || "")
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())}
    </span>
  );
}

function RequestCard({
  request,
  isSeeker,
  ndaPending,
  allDocuments,
  sharedDocuments,
  selectedDocs,
  setSelectedDocs,
  respondingId,
  respondToRequest,
  uploadingFor,
  setUploadingFor,
  uploadNewDocument,
  uploading,
}) {
  const responseDocument = request.response_document;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-semibold text-navy">
              {request.title || "Document Request"}
            </h3>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusClasses(
                request.status,
              )}`}
            >
              <StatusIcon status={request.status} />
              {formatRequestStatus(request.status)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              {String(request.request_type || "")
                .replaceAll("_", " ")
                .toLowerCase()
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </span>
            {request.created_at && (
              <span>Requested {formatDate(request.created_at)}</span>
            )}
          </div>
        </div>
      </div>

      {request.notes && (
        <div className="mt-4 rounded-xl border border-border bg-bg p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Request Details
          </p>

          <p className="mt-2 text-sm leading-6 text-muted">{request.notes}</p>
        </div>
      )}

      {responseDocument && (
        <div className="mt-4 rounded-xl border border-olive/20 bg-olive/5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-oliveD shadow-sm">
                <FileText size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-oliveD">
                  Response Document
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-navy">
                  {responseDocument.original_file_name ||
                    responseDocument.file_name ||
                    "Attached Document"}
                </p>

                {responseDocument.uploaded_at && (
                  <p className="mt-1 text-xs text-muted">
                    Uploaded {formatDate(responseDocument.uploaded_at)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <VerificationBadge
                status={responseDocument.verification_status}
              />

              {responseDocument.file_url && (
                <a
                  href={responseDocument.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-navyD"
                >
                  <FileText size={14} />
                  View Document
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Investor: request has not yet been answered */}
      {!isSeeker && request.status === "REQUESTED" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
          <Clock3 size={16} className="shrink-0 text-goldD" />

          <p className="text-sm text-muted">
            Waiting for the capital seeker to respond to this request.
          </p>
        </div>
      )}
      {!isSeeker && request.status === "UPLOADED" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <FileText size={16} className="shrink-0 text-blue-700" />

          <p className="text-sm text-blue-700">
            The capital seeker has submitted the requested document. It is now
            available for review.
          </p>
        </div>
      )}
      {/* Capital seeker response area */}
      {isSeeker && request.status === "REQUESTED" && (
        <div className="mt-4">
          {ndaPending ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    NDA Required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    This connection requires an NDA before additional documents
                    can be shared.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setUploadingFor(
                      uploadingFor === `nda-${request.id}`
                        ? null
                        : `nda-${request.id}`,
                    )
                  }
                  className="btn-navy btn-sm"
                >
                  <Upload size={14} />
                  Upload Signed NDA
                </button>

                <button
                  type="button"
                  disabled
                  className="btn-outline btn-sm opacity-60"
                >
                  Proceed Without NDA
                </button>
              </div>

              {uploadingFor === `nda-${request.id}` && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3">
                  <p className="mb-2 text-xs text-amber-700">
                    Upload the signed NDA from the Connection page.
                  </p>

                  <p className="text-xs text-muted">
                    Existing NDA upload/override handling remains in
                    ConnectionDetail.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-bg p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-navy">
                  Respond to Request
                </p>

                <p className="mt-1 text-xs text-muted">
                  Attach an existing document or upload new evidence.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={selectedDocs?.[request.id] || ""}
                  onChange={(event) =>
                    setSelectedDocs({
                      ...selectedDocs,
                      [request.id]: event.target.value,
                    })
                  }
                  className="input flex-1"
                >
                  <option value="">Select existing document</option>

                  {(allDocuments || [])
                    .filter(
                      (doc) =>
                        !(sharedDocuments || []).some(
                          (shared) => shared.id === doc.id,
                        ),
                    )
                    .map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.original_file_name || doc.file_name || "Document"}
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  disabled={
                    !selectedDocs?.[request.id] || respondingId === request.id
                  }
                  onClick={() => respondToRequest(request.id)}
                  className="btn-navy btn-sm whitespace-nowrap disabled:opacity-40"
                >
                  <Send size={14} />

                  {respondingId === request.id
                    ? "Sending..."
                    : "Attach Document"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setUploadingFor(
                      uploadingFor === request.id ? null : request.id,
                    )
                  }
                  className="btn-outline btn-sm whitespace-nowrap"
                >
                  <Upload size={14} />
                  Upload New
                </button>
              </div>

              {uploadingFor === request.id && (
                <div className="mt-3 rounded-xl border border-border bg-white p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    Upload New Evidence
                  </p>

                  <input
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        uploadNewDocument(request.id, file);
                      }
                    }}
                    className="block w-full text-sm text-muted"
                  />

                  {uploading && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <span className="anim-spin inline-block h-3.5 w-3.5 rounded-full border-2 border-border border-t-gold" />
                      Uploading and responding...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {request.status === "COMPLETED" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-olive/20 bg-olive/5 px-4 py-3">
          <CheckCircle2 size={16} className="shrink-0 text-oliveD" />

          <p className="text-sm font-medium text-oliveD">Request completed.</p>
        </div>
      )}
    </div>
  );
}

export default function DueDiligenceRequests({
  requests = [],
  isSeeker = false,
  ndaPending = false,
  allDocuments = [],
  sharedDocuments = [],
  selectedDocs = {},
  setSelectedDocs,
  respondingId = null,
  respondToRequest,
  uploadingFor = null,
  setUploadingFor,
  uploadNewDocument,
  uploading = false,
}) {
  const safeRequests = Array.isArray(requests) ? requests : [];

  const requestedCount = safeRequests.filter(
    (request) => request.status === "REQUESTED",
  ).length;

  const respondedCount = safeRequests.filter(
    (request) =>
      request.status === "RESPONDED" || request.status === "UPLOADED",
  ).length;

  const uploadedCount = safeRequests.filter(
    (request) => request.status === "UPLOADED",
  ).length;

  const completedCount = safeRequests.filter(
    (request) => request.status === "COMPLETED",
  ).length;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Due Diligence
          </p>

          <h1 className="font-display text-3xl font-semibold text-navy">
            Requests
          </h1>

          <p className="mt-1 text-sm text-muted">
            Document requests and responses associated with this diligence
            process.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SummaryBox label="Requested" value={requestedCount} tone="gold" />
          <SummaryBox label="Responded" value={respondedCount} />
          <SummaryBox label="Completed" value={completedCount} tone="olive" />
        </div>
      </div>

      {safeRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center shadow-card">
          <FileText size={28} className="mx-auto text-dim" />

          <h2 className="mt-3 font-display text-xl font-semibold text-navy">
            No diligence requests
          </h2>

          <p className="mt-1 text-sm text-muted">
            There are currently no document requests associated with this
            connection.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              isSeeker={isSeeker}
              ndaPending={ndaPending}
              allDocuments={allDocuments}
              sharedDocuments={sharedDocuments}
              selectedDocs={selectedDocs}
              setSelectedDocs={setSelectedDocs}
              respondingId={respondingId}
              respondToRequest={respondToRequest}
              uploadingFor={uploadingFor}
              setUploadingFor={setUploadingFor}
              uploadNewDocument={uploadNewDocument}
              uploading={uploading}
            />
          ))}
        </div>
      )}
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
