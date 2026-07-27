import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  listingAPI,
  interestAPI,
  investorAPI,
  documentAPI,
  scoreAPI,
} from "../../api/index.js";
import {
  Alert,
  Spinner,
  Modal,
  EmptyState,
  formatINR,
  formatDate,
  PageHeader,
  ScoreRing,
  GradeBadge,
} from "../../components/ui/index.jsx";
import {
  FolderOpen,
  Lightbulb,
  MapPin,
  Megaphone,
  Lock,
  Unlock,
  Clock3,
  CheckCircle,
  XCircle,
  Star,
  FileText,
} from "lucide-react";
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

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [docs, setDocs] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [myInterest, setMyInterest] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [score, setScore] = useState(null);
  const [interestStatus, setInterestStatus] = useState(null);

  const load = () => {
    Promise.all([listingAPI.getPublic(id), interestAPI.mine()])
      .then(([lr, ir]) => {
        setListing(lr.data.data);
        const existing = ir.data.data.find((i) => i.startup_id === id);
        setMyInterest(existing || null);
        // Load docs after we know interest status (backend enforces visibility too)
        return documentAPI
          .list(id)
          .catch(() => ({ data: { data: [], locked: true } }));
      })
      .then((dr) => {
        setDocs(dr.data.data);
        setInterestStatus(dr.data.interest_status || null);
        return scoreAPI
          .getPublicScore(id)
          .catch(() => ({ data: { data: null } }));
      })
      .then((sr) => {
        setScore(sr.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const express = async () => {
    setSending(true);
    setError("");
    try {
      const r = await interestAPI.send({ startup_id: id, message });
      setMyInterest(r.data.data);
      setSuccess("Interest sent! The capital seeker has been notified.");
      setModal(false);
      // Reload docs after expressing interest
      documentAPI
        .list(id)
        .then((r) => {
          setDocs(r.data.data);
          setInterestStatus(r.data.interest_status || "PENDING");
        })
        .catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send interest");
    } finally {
      setSending(false);
    }
  };

  const toggleSave = async () => {
    try {
      const r = await investorAPI.save(id);
      setSaved(r.data.saved);
    } catch {}
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  if (!listing) return <Alert type="error" message="Listing not found" />;

  const interestAccepted = myInterest?.status === "ACCEPTED";
  const publicDocs = docs.filter((d) => d.visibility === "PUBLIC");
  const privateDocs = docs.filter((d) => d.visibility === "INTERESTED_ONLY");

  return (
    <div className="anim-up">
      <div className="mb-4">
        <Link to="/investor/discover" className="btn-ghost text-sm">
          ← Back to Discovery
        </Link>
      </div>

      <PageHeader
        title={listing.name}
        subtitle={`${listing.sector} · ${listing.stage?.replace(/_/g, " ")} · ${listing.entity_type}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleSave}
              className={`btn-outline btn-sm ${saved ? "!text-gold !border-gold" : ""}`}
            >
              {saved ? "★ Saved" : "☆ Save"}
            </button>
            {myInterest ? (
              <span
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                  myInterest.status === "ACCEPTED"
                    ? "badge-olive"
                    : myInterest.status === "REJECTED"
                      ? "badge-red"
                      : "badge-amber"
                }`}
              >
                {myInterest.status === "ACCEPTED"
                  ? "✓ Interest Accepted"
                  : myInterest.status === "REJECTED"
                    ? "✕ Interest Rejected"
                    : "⏳ Interest Pending"}
              </span>
            ) : (
              <button onClick={() => setModal(true)} className="btn-gold">
                Express Interest →
              </button>
            )}
          </div>
        }
      />

      <Alert type="success" message={success} onClose={() => setSuccess("")} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <p className="text-muted text-sm leading-relaxed">
              {listing.summary}
            </p>
            {listing.location_city && (
              <p className="text-xs text-dim mt-3">
                📍 {listing.location_city}, {listing.location_country}
              </p>
            )}
          </div>

          {listing.use_of_funds && (
            <div className="card">
              <h3 className="font-display text-base font-semibold text-navy pb-3 mb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-gold" />
                  <h3 className="font-display text-base font-semibold text-navy">
                    Use of Funds
                  </h3>
                </div>
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                {listing.use_of_funds}
              </p>
            </div>
          )}

          {/* Documents */}
          <div className="card">
            <h3 className="font-display text-base font-semibold text-navy pb-3 mb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-gold" />
                <h3 className="font-display text-base font-semibold text-navy">
                  Documents
                </h3>
              </div>
            </h3>

            {/* Public docs — always visible */}
            {docs.filter((d) => d.visibility === "PUBLIC").length > 0 ? (
              <div className="mb-4">
                <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">
                  🌐 Public
                </p>
                <div className="space-y-2">
                  {docs
                    .filter((d) => d.visibility === "PUBLIC")
                    .map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-3 bg-bg border border-border"
                      >
                        <div
                          className="
  flex items-center
  gap-2 flex-wrap
  mt-1
"
                        >
                          <p className="text-xs text-dim">
                            {d.document_type.replace(/_/g, " ")}·
                            {formatDate(d.uploaded_at)}
                          </p>

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
                        </div>
                        <a
                          href={`/api/document/${d.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline btn-xs"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-muted text-sm mb-4">
                No public documents uploaded yet.
              </p>
            )}

            {/* Private docs — locked until interest accepted */}
            <div className="border-t border-border pt-4 mt-2">
              <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-gold" />
                  <p className="text-xs text-muted uppercase tracking-wider font-semibold">
                    Private Documents
                  </p>
                </div>
              </p>
              {interestStatus === "ACCEPTED" &&
              docs.filter((d) => d.visibility === "INTERESTED_ONLY").length >
                0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-olive font-semibold mb-2">
                    <div className="flex items-center gap-2 text-xs text-olive font-semibold mb-2">
                      <Unlock size={15} />
                      <span>Unlocked — Interest Accepted</span>
                    </div>
                  </div>
                  {docs
                    .filter((d) => d.visibility === "INTERESTED_ONLY")
                    .map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-3 bg-olive/5 border border-olive/20"
                      >
                        <div>
                          <p className="text-sm font-medium text-text">
                            {d.file_name}
                          </p>
                          <div
                            className="
  flex items-center
  gap-2 flex-wrap
  mt-1
"
                          >
                            <p className="text-xs text-dim">
                              {d.document_type.replace(/_/g, " ")}·
                              {formatDate(d.uploaded_at)}
                            </p>

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
                          </div>
                        </div>
                        <a
                          href={`/api/document/${d.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline btn-xs"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                </div>
              ) : (
                <div
                  className={`p-4 border border-dashed text-center ${
                    interestStatus === "PENDING"
                      ? "border-amber-300 bg-amber-50"
                      : interestStatus === "REJECTED"
                        ? "border-red-200 bg-red-50"
                        : "border-border bg-bg"
                  }`}
                >
                  <p className="text-sm font-semibold text-navy mb-1">
                    {interestStatus === "PENDING"
                      ? "⏳ Awaiting acceptance"
                      : interestStatus === "REJECTED"
                        ? "✕ Interest not accepted"
                        : "🔒 Private documents locked"}
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    {interestStatus === "PENDING"
                      ? "Private documents will unlock once the capital seeker accepts your interest."
                      : interestStatus === "REJECTED"
                        ? "Your interest was not accepted — private documents remain locked."
                        : "Express interest to request access. Documents unlock if the capital seeker accepts."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Updates */}
          {listing.updates?.length > 0 && (
            <div className="card">
              <h3 className="font-display text-base font-semibold text-navy pb-3 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Megaphone size={18} className="text-gold" />
                  <h3 className="font-display text-base font-semibold text-navy">
                    Updates
                  </h3>
                </div>
              </h3>
              <div className="space-y-4">
                {listing.updates.map((u) => (
                  <div key={u.id} className="border-l-2 border-gold pl-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-text text-sm">
                        {u.title}
                      </p>
                      <p className="text-xs text-dim">
                        {formatDate(u.created_at)}
                      </p>
                    </div>
                    <p className="text-muted text-sm leading-relaxed">
                      {u.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-1">
            <h3 className="font-display text-xs font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border mb-2">
              Deal Metrics
            </h3>
            {[
              ["Funding Ask", formatINR(listing.funding_ask)],
              ["Valuation", formatINR(listing.valuation_expectation)],
              ["Revenue (LY)", formatINR(listing.revenue_last_year)],
              ["Monthly Burn", formatINR(listing.monthly_burn)],
              ["Interests", `${listing._count?.interests || 0} expressed`],
              ["Listed", formatDate(listing.created_at)],
            ]
              .filter(([, v]) => v && v !== "—")
              .map(([l, v]) => (
                <div
                  key={l}
                  className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0"
                >
                  <span className="text-xs text-dim">{l}</span>
                  <span className="text-xs font-semibold text-text">{v}</span>
                </div>
              ))}
          </div>

          <div className="card">
            <h3 className="font-display text-xs font-semibold text-navy uppercase tracking-wider mb-3">
              Capital Seeker
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-navy/10 border border-navy/20 flex items-center justify-center text-navy font-display font-bold">
                {listing.capital_seeker?.name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-text text-sm">
                  {listing.capital_seeker?.name}
                </p>
                <p className="text-xs text-dim">
                  {listing.capital_seeker?.capitalSeekerProfile?.entity_type}
                </p>
              </div>
            </div>
            {listing.capital_seeker?.capitalSeekerProfile?.city && (
              <p className="text-xs text-muted mt-2">
                <div className="flex items-center gap-1 text-xs text-dim mt-3">
                  <MapPin size={14} />
                  <span>
                    {listing.location_city}, {listing.location_country}
                  </span>
                </div>
              </p>
            )}
          </div>

          {score && (
            <div className="card text-center">
              <h3 className="font-display text-xs font-semibold text-navy uppercase tracking-wider mb-3">
                Readiness Score
              </h3>
              <div className="flex justify-center mb-2">
                <ScoreRing score={score} size={80} />
              </div>
              <GradeBadge grade={score.grade} />
              <p className="text-xs text-muted mt-2">{score.total_score}/100</p>
              {score.decision && (
                <div
                  className="mt-2 text-xs font-bold uppercase tracking-wider px-2 py-1 border inline-block"
                  style={{
                    color: {
                      STRONG_BUY: "#059669",
                      INVESTIGATE: "#022440",
                      WATCH: "#B45309",
                      PASS: "#DC2626",
                    }[score.decision],
                    borderColor: {
                      STRONG_BUY: "#059669",
                      INVESTIGATE: "#022440",
                      WATCH: "#B45309",
                      PASS: "#DC2626",
                    }[score.decision],
                    background: `${{ STRONG_BUY: "#059669", INVESTIGATE: "#022440", WATCH: "#B45309", PASS: "#DC2626" }[score.decision]}12`,
                  }}
                >
                  {score.decision?.replace(/_/g, " ")}
                </div>
              )}
              {score.confidence_label && (
                <p className="text-xs text-muted mt-1">
                  {score.confidence_label} Confidence
                </p>
              )}
              {score.verdict && (
                <p className="text-xs text-muted mt-2 italic leading-relaxed px-1">
                  "{score.verdict}"
                </p>
              )}
            </div>
          )}
          <div className="card border-gold/30 bg-gradient-to-br from-gold/5 to-white hover:border-gold transition-all duration-300">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">
                <img
                  src="/logo.png"
                  alt="KuberList"
                  className="h-12 mx-auto mb-3"
                />
              </div>

              <h3 className="font-display text-lg font-semibold text-navy">
                KuberList Investment Intelligence
              </h3>

              <p className="text-xs text-muted mt-1">
                Comprehensive investment analysis powered by KuberList
                Intelligence.
              </p>
            </div>

            <button
              onClick={() => navigate(`/investor/listings/${id}/report`)}
              className="w-full bg-gold text-navy font-semibold py-3 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
            >
              Open Intelligence Report →
            </button>
          </div>
          {!myInterest && (
            <button onClick={() => setModal(true)} className="btn-gold w-full">
              Express Interest →
            </button>
          )}
          {myInterest?.status === "ACCEPTED" && (
            <div className="card bg-olive/8 border-olive/25 text-center py-4">
              <p className="text-oliveD text-sm font-semibold">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle size={17} />
                  <span>Interest Accepted</span>
                </div>
              </p>
              <p className="text-muted text-xs mt-1">
                Private documents are now unlocked.
              </p>
            </div>
          )}
          {myInterest?.status === "PENDING" && (
            <div className="card bg-amber-50 border-amber-200 text-center py-4">
              <p className="text-amber-700 text-sm font-semibold">
                ⏳ Awaiting Response
              </p>
              <p className="text-amber-600 text-xs mt-1">
                The capital seeker will review your interest.
              </p>
            </div>
          )}
          {myInterest?.status === "REJECTED" && (
            <div className="card bg-red-50 border-red-200 text-center py-4">
              <p className="text-red-600 text-sm font-semibold">
                ✕ Interest Not Accepted
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Express Interest Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`Express Interest — ${listing.name}`}
      >
        <p className="text-muted text-sm mb-5">
          Your investor profile will be shared with the capital seeker. A
          personalised message significantly improves response rates.
        </p>
        <div className="mb-5">
          <label className="label">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="We invest in early-stage FinTech and would love to explore a potential partnership…"
          />
        </div>
        <Alert type="error" message={error} onClose={() => setError("")} />
        <div className="flex gap-3">
          <button
            onClick={express}
            disabled={sending}
            className="btn-gold flex-1 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Spinner size="sm" />
                Sending…
              </>
            ) : (
              "Send Interest →"
            )}
          </button>
          <button
            onClick={() => setModal(false)}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
