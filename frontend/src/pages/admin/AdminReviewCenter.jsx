import { useEffect, useMemo, useState } from "react";

import { documentAPI } from "../../api/index.js";

import {
  PageHeader,
  Alert,
  Spinner,
  EmptyState,
  formatDate,
} from "../../components/ui/index.jsx";

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

const DOC_ICONS = {
  PITCH_DECK: "📊",
  FINANCIAL_MODEL: "💹",
  BUSINESS_PLAN: "📋",
  TERM_SHEET: "📄",
  CAP_TABLE: "📈",

  PURCHASE_ORDER: "🧾",
  REVENUE_PROOF: "💰",
  CUSTOMER_CONTRACT: "🤝",

  GOVERNMENT_CONTRACT: "📜",
  PATENT_CERTIFICATE: "💡",
  ACCELERATOR_CERTIFICATE: "🚀",
  STARTUP_INDIA_CERTIFICATE: "🇮🇳",

  OTHER: "📎",
};

export default function AdminReviewCenter() {
  const [docs, setDocs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [verifyForm, setVerifyForm] = useState({});

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("ALL");

  const loadDocuments = async () => {
    try {
      const r = await documentAPI.adminAll();

      setDocs(r.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const updateVerification = async (docId) => {
    try {
      const payload = verifyForm[docId];

      if (!payload) return;

      await documentAPI.verify(
        docId,

        {
          status: payload.status,

          notes: payload.notes,
        },
      );

      setSuccess("Verification updated");

      loadDocuments();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Verification update failed");
    }
  };

  const filteredDocs = useMemo(() => {
    let arr = [...docs];

    if (filter !== "ALL") {
      arr = arr.filter((d) => d.verification_status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      arr = arr.filter(
        (d) =>
          d.file_name?.toLowerCase().includes(q) ||
          d.startup?.name?.toLowerCase().includes(q) ||
          d.founder?.name?.toLowerCase().includes(q),
      );
    }

    return arr;
  }, [docs, filter, search]);

  return (
    <div className="anim-up">
      <PageHeader
        title="Review Center"
        subtitle="
          Institutional diligence
          and verification workflow
        "
      />

      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      <Alert type="error" message={error} onClose={() => setError("")} />

      {/* FILTERS */}

      <div
        className="
        card mb-5
        flex flex-col lg:flex-row
        gap-4 lg:items-center
        lg:justify-between
      "
      >
        <input
          type="text"
          placeholder="
            Search startup,
            founder or document...
          "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            input lg:max-w-md
          "
        />

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="
            select lg:max-w-xs
          "
        >
          <option value="ALL">All Verification States</option>

          <option value="UPLOADED">Uploaded</option>

          <option value="THIRD_PARTY_VERIFIED">3rd Party Verified</option>

          <option value="KUBERLIST_REVIEWED">KuberList Reviewed</option>
        </select>
      </div>

      {/* CONTENT */}

      {loading ? (
        <div
          className="
          flex justify-center py-16
        "
        >
          <Spinner size="lg" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <EmptyState
          icon="📂"
          title="
            No documents found
          "
          description="
            No documents match
            current filters.
          "
        />
      ) : (
        <div className="space-y-4">
          {filteredDocs.map((d) => (
            <div
              key={d.id}
              className="
                card border border-border
              "
            >
              <div
                className="
                flex gap-4
              "
              >
                {/* ICON */}

                <div
                  className="
                  text-3xl flex-shrink-0
                "
                >
                  {DOC_ICONS[d.document_type] || "📎"}
                </div>

                {/* MAIN */}

                <div
                  className="
                  flex-1 min-w-0
                "
                >
                  {/* TOP */}

                  <div
                    className="
                    flex flex-col lg:flex-row
                    lg:items-start
                    lg:justify-between
                    gap-4
                  "
                  >
                    <div>
                      <h3
                        className="
                        font-semibold
                        text-text
                        text-base
                      "
                      >
                        {d.file_name}
                      </h3>

                      <div
                        className="
                        mt-2 flex flex-wrap
                        items-center gap-2
                      "
                      >
                        <span
                          className="
                          badge-navy
                        "
                        >
                          {d.document_type?.replace(/_/g, " ")}
                        </span>

                        <span
                          className="
                          badge-olive
                        "
                        >
                          {d.visibility}
                        </span>

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
                      </div>
                    </div>

                    <div
                      className="
                      text-xs text-dim
                      lg:text-right
                    "
                    >
                      <div>Uploaded: {formatDate(d.uploaded_at)}</div>

                      {d.verified_at && (
                        <div className="mt-1">
                          Verified: {formatDate(d.verified_at)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STARTUP INFO */}

                  <div
                    className="
                    mt-4 grid
                    grid-cols-1 md:grid-cols-2
                    gap-4
                  "
                  >
                    <div
                      className="
                      p-3 rounded-xl
                      bg-muted/30
                    "
                    >
                      <div
                        className="
                        text-xs text-dim mb-1
                      "
                      >
                        Startup
                      </div>

                      <div
                        className="
                        font-semibold text-sm
                      "
                      >
                        {d.startup?.name}
                      </div>
                    </div>

                    <div
                      className="
                      p-3 rounded-xl
                      bg-muted/30
                    "
                    >
                      <div
                        className="
                        text-xs text-dim mb-1
                      "
                      >
                        Founder
                      </div>

                      <div
                        className="
                        font-semibold text-sm
                      "
                      >
                        {d.founder?.name}
                      </div>

                      <div
                        className="
                        text-xs text-dim mt-1
                      "
                      >
                        {d.founder?.email}
                      </div>
                    </div>
                  </div>

                  {/* NOTES */}

                  <div className="mt-5">
                    <label
                      className="
                      label text-xs
                    "
                    >
                      Verification Notes
                    </label>

                    <textarea
                      value={
                        verifyForm[d.id]?.notes ?? d.verification_notes ?? ""
                      }
                      onChange={(e) =>
                        setVerifyForm((prev) => ({
                          ...prev,

                          [d.id]: {
                            ...prev[d.id],

                            status: prev[d.id]?.status || d.verification_status,

                            notes: e.target.value,
                          },
                        }))
                      }
                      rows={3}
                      className="
                        input py-2
                        text-sm
                      "
                      placeholder="
                        Add diligence notes,
                        verification remarks,
                        evidence observations...
                      "
                    />
                  </div>

                  {/* ACTIONS */}

                  <div
                    className="
                    mt-5 flex flex-col
                    lg:flex-row gap-3
                    lg:items-center
                    lg:justify-between
                  "
                  >
                    <select
                      value={verifyForm[d.id]?.status || d.verification_status}
                      onChange={(e) =>
                        setVerifyForm((prev) => ({
                          ...prev,

                          [d.id]: {
                            ...prev[d.id],

                            status: e.target.value,

                            notes:
                              prev[d.id]?.notes || d.verification_notes || "",
                          },
                        }))
                      }
                      className="
                        select lg:max-w-xs
                      "
                    >
                      <option value="UPLOADED">Uploaded</option>

                      <option value="THIRD_PARTY_VERIFIED">
                        3rd Party Verified
                      </option>

                      <option value="KUBERLIST_REVIEWED">
                        KuberList Reviewed
                      </option>
                    </select>

                    <div
                      className="
                      flex items-center
                      gap-2 flex-wrap
                    "
                    >
                      <button
                        onClick={() => documentAPI.download(d.id)}
                        className="btn-outline btn-sm"
                      >
                        View Document
                      </button>

                      <button
                        onClick={() => updateVerification(d.id)}
                        className="
                          btn-navy btn-sm
                        "
                      >
                        Save Verification
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
