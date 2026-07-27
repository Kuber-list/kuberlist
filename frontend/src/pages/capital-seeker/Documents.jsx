import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";

import { listingAPI, documentAPI } from "../../api/index.js";

import {
  PageHeader,
  Alert,
  Spinner,
  Modal,
  EmptyState,
  formatDate,
} from "../../components/ui/index.jsx";

const DOC_TYPES = [
  "PITCH_DECK",
  "FINANCIAL_MODEL",
  "BUSINESS_PLAN",
  "TERM_SHEET",
  "CAP_TABLE",

  "PURCHASE_ORDER",
  "REVENUE_PROOF",
  "CUSTOMER_CONTRACT",

  "GOVERNMENT_CONTRACT",
  "PATENT_CERTIFICATE",
  "ACCELERATOR_CERTIFICATE",
  "STARTUP_INDIA_CERTIFICATE",

  "OTHER",
];

const DOC_ICONS = {
  PITCH_DECK: "📊",
  FINANCIAL_MODEL: "💹",
  BUSINESS_PLAN: "📋",
  TERM_SHEET: "📄",
  CAP_TABLE: "📈",
  GOVERNMENT_CONTRACT: "📜",
  PURCHASE_ORDER: "🧾",
  REVENUE_PROOF: "💰",
  CUSTOMER_CONTRACT: "🤝",
  PATENT_CERTIFICATE: "💡",
  ACCELERATOR_CERTIFICATE: "🚀",
  STARTUP_INDIA_CERTIFICATE: "🇮🇳",
  OTHER: "📎",
};

const MAX_SIZE_MB = 10;

const VERIFY_CONFIG = {
  UPLOADED: {
    label: "Uploaded",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  },

  THIRD_PARTY_VERIFIED: {
    label: "3rd Party Verified",
    className: "bg-orange-100 text-orange-700 border border-orange-200",
  },

  KUBERLIST_REVIEWED: {
    label: "KuberList Reviewed",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
};

export default function Documents() {
  const { user } = useAuth();

  const [listings, setListings] = useState([]);

  const [docs, setDocs] = useState([]);

  const [selListing, setSelListing] = useState("");

  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [modal, setModal] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [upForm, setUpForm] = useState({
    document_type: "PITCH_DECK",
    visibility: "PUBLIC",
  });

  const [file, setFile] = useState(null);

  const loadListings = async () => {
    try {
      const r = await listingAPI.getAll();

      setListings(r.data.data);

      if (r.data.data.length > 0 && !selListing) {
        setSelListing(r.data.data[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const loadDocs = async (lid) => {
    if (!lid) return;

    try {
      const r = await documentAPI.list(lid);

      setDocs(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents");
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    loadDocs(selListing);
  }, [selListing]);

  const upload = async (e) => {
    e.preventDefault();

    if (!file || !selListing) {
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_SIZE_MB}MB.`);

      return;
    }

    setUploading(true);
    setError("");

    try {
      const fd = new FormData();

      fd.append("file", file);

      fd.append("startup_id", selListing);

      fd.append("document_type", upForm.document_type);

      fd.append("visibility", upForm.visibility);

      await documentAPI.upload(fd);

      setSuccess("Document uploaded successfully");

      setModal(false);

      setFile(null);

      setUpForm({
        document_type: "PITCH_DECK",
        visibility: "PUBLIC",
      });

      loadDocs(selListing);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const del = async (docId) => {
    if (!confirm("Delete this document?")) {
      return;
    }

    try {
      await documentAPI.delete(docId);

      setSuccess("Document deleted");

      loadDocs(selListing);
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  const publicDocs = docs.filter((d) => d.visibility === "PUBLIC");

  const privateDocs = docs.filter((d) => d.visibility === "INTERESTED_ONLY");

  return (
    <div className="anim-up">
      <PageHeader
        title="Documents"
        subtitle="
          Manage investor materials
          and evidence visibility
        "
        actions={
          user?.role === "CAPITAL_SEEKER" && (
            <button onClick={() => setModal(true)} className="btn-navy">
              + Upload Document
            </button>
          )
        }
      />

      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      <Alert type="error" message={error} onClose={() => setError("")} />

      {/* INFO SECTION */}

      <div className="card mb-5 border-navy/20 bg-navy/5">
        <div
          className="
          grid grid-cols-1
          sm:grid-cols-2
          gap-4 text-sm
        "
        >
          <div
            className="
            flex items-start gap-3
          "
          >
            <span
              className="
              text-xl flex-shrink-0
            "
            >
              🌐
            </span>

            <div>
              <p
                className="
                font-semibold
                text-navy
                mb-0.5
              "
              >
                Public Documents
              </p>

              <p
                className="
                text-muted
                text-xs
                leading-relaxed
              "
              >
                Visible to all investors.
              </p>
            </div>
          </div>

          <div
            className="
            flex items-start gap-3
          "
          >
            <span
              className="
              text-xl flex-shrink-0
            "
            >
              🔒
            </span>

            <div>
              <p
                className="
                font-semibold
                text-navy
                mb-0.5
              "
              >
                Private Documents
              </p>

              <p
                className="
                text-muted
                text-xs
                leading-relaxed
              "
              >
                Only visible after interest acceptance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LISTING SELECTOR */}

      {listings.length > 1 && (
        <div className="mb-5">
          <label className="label">Select Listing</label>

          <select
            value={selListing}
            onChange={(e) => setSelListing(e.target.value)}
            className="
              select max-w-xs
            "
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* STATES */}

      {loading ? (
        <div
          className="
          flex justify-center py-16
        "
        >
          <Spinner size="lg" />
        </div>
      ) : !selListing ? (
        <EmptyState
          icon="📁"
          title="No listings"
          description="
            Create a listing first.
          "
        />
      ) : docs.length === 0 ? (
        <EmptyState
          icon="📎"
          title="No documents yet"
          description="
            Upload investor materials.
          "
          action={
            user?.role === "CAPITAL_SEEKER" && (
              <button
                onClick={() => setModal(true)}
                className="
                  btn-navy inline-flex
                "
              >
                Upload Document →
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          {/* PUBLIC DOCS */}

          {publicDocs.length > 0 && (
            <div>
              <h3
                className="
                font-display
                text-base
                font-semibold
                text-navy
                mb-3
                flex items-center gap-2
              "
              >
                🌐 Public
                <span
                  className="
                  text-muted
                  text-xs
                  font-normal
                  font-body
                "
                >
                  — visible to investors
                </span>
              </h3>

              <div className="space-y-2">
                {publicDocs.map((d) => (
                  <DocumentCard
                    key={d.id}
                    d={d}
                    del={del}
                    canDelete={user?.role === "CAPITAL_SEEKER"}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PRIVATE DOCS */}

          {privateDocs.length > 0 && (
            <div>
              <h3
                className="
                font-display
                text-base
                font-semibold
                text-navy
                mb-3
                flex items-center gap-2
              "
              >
                🔒 Private
                <span
                  className="
                  text-muted
                  text-xs
                  font-normal
                  font-body
                "
                >
                  — unlocked after interest
                </span>
              </h3>

              <div className="space-y-2">
                {privateDocs.map((d) => (
                  <DocumentCard
                    key={d.id}
                    d={d}
                    del={del}
                    privateMode
                    canDelete={user?.role === "CAPITAL_SEEKER"}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL */}

      <Modal
        open={modal}
        onClose={() => {
          setModal(false);
          setFile(null);
          setError("");
        }}
        title="Upload Document"
      >
        <form onSubmit={upload} className="space-y-4">
          <div>
            <label className="label">Document Type</label>

            <select
              value={upForm.document_type}
              onChange={(e) =>
                setUpForm((prev) => ({
                  ...prev,
                  document_type: e.target.value,
                }))
              }
              className="select"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Visibility</label>

            <div
              className="
              grid grid-cols-2 gap-3
            "
            >
              {[
                {
                  v: "PUBLIC",
                  icon: "🌐",
                  label: "Public",
                },

                {
                  v: "INTERESTED_ONLY",
                  icon: "🔒",
                  label: "Private",
                },
              ].map(({ v, icon, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setUpForm((prev) => ({
                      ...prev,
                      visibility: v,
                    }))
                  }
                  className={`
                    border p-3 text-left
                    transition-all duration-150

                    ${
                      upForm.visibility === v
                        ? "border-navy bg-navy/5"
                        : "border-border hover:border-navy/30"
                    }
                  `}
                >
                  <div
                    className="
                    text-lg mb-1
                  "
                  >
                    {icon}
                  </div>

                  <div
                    className="
                    font-semibold
                    text-xs
                    text-navy
                  "
                  >
                    {label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">File (max {MAX_SIZE_MB}MB)</label>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="
                input pt-1.5
                file:mr-3
                file:border-0
                file:bg-navy
                file:text-white
                file:text-xs
                file:px-3
                file:py-1
              "
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading || !file}
              className="
                btn-navy flex-1
                flex items-center
                justify-center gap-2
              "
            >
              {uploading ? (
                <>
                  <Spinner size="sm" />
                  Uploading…
                </>
              ) : (
                "↑ Upload"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setModal(false);
                setFile(null);
                setError("");
              }}
              className="
                btn-outline flex-1
              "
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DocumentCard({ d, del, privateMode = false, canDelete = false }) {
  return (
    <div
      className={`
      card flex gap-4 py-4

      ${privateMode ? "border-amber-200 bg-amber-50/30" : ""}
    `}
    >
      <span
        className="
        text-2xl flex-shrink-0
      "
      >
        {DOC_ICONS[d.document_type] || "📎"}
      </span>

      <div
        className="
        flex-1 min-w-0
      "
      >
        <p
          className="
          font-semibold
          text-text
          text-sm
          truncate
        "
        >
          {d.file_name}
        </p>

        <div
          className="
          flex items-center
          gap-3 mt-1 flex-wrap
        "
        >
          <span className="badge-navy">
            {d.document_type.replace(/_/g, " ")}
          </span>

          <span className={privateMode ? "badge-amber" : "badge-olive"}>
            {privateMode ? "🔒 Private" : "Public"}
          </span>

          {d.verification_status && (
            <span
              className={`
                text-[11px]
                px-2 py-1
                rounded-full
                font-medium
                ${VERIFY_CONFIG[d.verification_status]?.className}
              `}
            >
              {VERIFY_CONFIG[d.verification_status]?.label}
            </span>
          )}

          <span
            className="
            text-xs text-dim
          "
          >
            {formatDate(d.uploaded_at)}
          </span>

          {d.file_size && (
            <span
              className="
              text-xs text-dim
            "
            >
              {(d.file_size / 1024).toFixed(1)} KB
            </span>
          )}
        </div>

        {/* VERIFICATION NOTES */}

        {d.verification_notes && (
          <div
            className="
            mt-2 text-xs
            text-muted
            leading-relaxed
          "
          >
            <span
              className="
              font-medium text-navy
            "
            >
              Verification Note:
            </span>{" "}
            {d.verification_notes}
          </div>
        )}

        {/* ACTIONS */}

        <div
          className="
          mt-3 flex items-center
          gap-2 flex-wrap
        "
        >
          <a
            href={d.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="
              btn-outline btn-xs
            "
          >
            View
          </a>

          {canDelete && (
            <button
              onClick={() => del(d.id)}
              className="
                btn-danger btn-xs
              "
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
