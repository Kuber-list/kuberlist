import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { listingAPI, investorAPI } from "../../api/index.js";
import {
  PageHeader,
  Spinner,
  Pagination,
  EmptyState,
  formatINR,
  formatDate,
  GradeBadge,
} from "../../components/ui/index.jsx";
import {
  Star,
  X,
  ArrowUpRight,
  Building2,
  TrendingUp,
  Target,
  Sparkles,
  BadgeCheck,
  CircleDollarSign,
  MapPin,
  Zap,
  CheckCircle2,
} from "lucide-react";
const SECTORS = [
  "FinTech",
  "HealthTech",
  "AgriTech",
  "EdTech",
  "SaaS",
  "D2C",
  "CleanTech",
  "AI/ML",
  "LogiTech",
  "RetailTech",
  "ManufacTech",
  "PropTech",
];
const STAGES = ["idea", "pre_seed", "seed", "series_a", "series_b", "growth"];

const DECISION_STYLES = {
  STRONG_BUY: {
    label: "Strong Buy",
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  INVESTIGATE: {
    label: "Investigate",
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  WATCH: {
    label: "Watch",
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  PASS: {
    label: "Pass",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-600",
    dot: "bg-red-400",
  },
};

function DecisionBadge({ decision }) {
  if (!decision) return null;
  const s = DECISION_STYLES[decision] || DECISION_STYLES.WATCH;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${s.bg} ${s.border} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function ConfidencePill({ label }) {
  if (!label) return null;
  const map = {
    High: "text-green-600 bg-green-50",
    Medium: "text-amber-600 bg-amber-50",
    Low: "text-red-600 bg-red-50",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 ${map[label] || ""}`}>
      {label} Confidence
    </span>
  );
}

export default function Discover() {
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState({});
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [entityType, setEntityType] = useState("");
  const [sort, setSort] = useState("ranked");
  const [page, setPage] = useState(1);
  const [showProfileBanner, setShowProfileBanner] = useState(false);

  useEffect(() => {
    investorAPI
      .getProfile()
      .then((r) => {
        const p = r.data.data;
        setShowProfileBanner(
          !p || (!p.preferred_sectors?.length && !p.ticket_min),
        );
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    listingAPI
      .browse({
        search,
        sector,
        stage,
        entity_type: entityType,
        sort,
        page,
        limit: 12,
      })
      .then((r) => {
        setListings(r.data.data.listings);
        setPagination(r.data.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [search, sector, stage, entityType, sort, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setPage(1);
  }, [search, sector, stage, entityType, sort]);

  const toggleSave = async (id) => {
    try {
      const r = await investorAPI.save(id);
      setSaved((s) => ({ ...s, [id]: r.data.saved }));
    } catch {}
  };

  const clear = () => {
    setSearch("");
    setSector("");
    setStage("");
    setEntityType("");
  };

  return (
    <div className="anim-up">
      <PageHeader
        title="Deal Discovery"
        subtitle={`${pagination.total} active listing${pagination.total !== 1 ? "s" : ""}`}
      />

      {showProfileBanner && (
        <div className="card border-gold/40 bg-gold/5 mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-navy text-sm">
              Set preferences for personalised deal ranking
            </p>
            <p className="text-muted text-xs mt-0.5">
              Without preferences, deals are shown without personalised ranking.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to="/investor/profile" className="btn-gold btn-sm">
              Set Preferences <ArrowUpRight className="inline w-4 h-4 ml-1" />
            </Link>
            <button
              onClick={() => setShowProfileBanner(false)}
              className="btn-ghost text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="label">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            placeholder="Search by name, sector…"
          />
        </div>
        <div className="w-36">
          <label className="label">Sector</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="select"
          >
            <option value="">All Sectors</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="label">Stage</label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="select"
          >
            <option value="">All Stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="label">Type</label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="select"
          >
            <option value="">All Types</option>
            <option value="STARTUP">Startup</option>
            <option value="SME">SME</option>
          </select>
        </div>
        <div className="w-32">
          <label className="label">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="select"
          >
            <option value="ranked">Ranked for You</option>
            <option value="newest">Newest</option>
            <option value="funding">Highest Ask</option>
          </select>
        </div>
        {(search || sector || stage || entityType) && (
          <button onClick={clear} className="btn-ghost text-xs mb-0.5">
            <X className="w-4 h-4 inline mr-1" />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No listings found"
          description="Try adjusting your filters."
          action={
            (search || sector || stage || entityType) && (
              <button onClick={clear} className="btn-outline btn-sm">
                Clear Filters
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-4 stagger">
            {listings.map((l) => (
              <div key={l.id} className="card-hover group relative">
                {/* Save button */}
                <button
                  onClick={() => toggleSave(l.id)}
                  className={`absolute top-4 right-4 text-xl transition-colors ${saved[l.id] || l.isSaved ? "text-gold" : "text-dim hover:text-gold"}`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      saved[l.id] || l.isSaved ? "fill-current" : ""
                    }`}
                  />
                </button>

                <Link to={`/investor/listings/${l.id}`} className="block pr-8">
                  {/* Header row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-display text-lg font-semibold text-navy group-hover:text-gold transition-colors">
                          {l.name}
                        </h3>
                        {l.decision && <DecisionBadge decision={l.decision} />}
                        {l.grade && <GradeBadge grade={l.grade} />}
                        {l.momentum_score >= 6 && (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5">
                            <>
                              <Zap className="w-3 h-3" />
                              Momentum
                            </>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge-navy">{l.sector}</span>
                        <span className="badge-gray">
                          {l.stage?.replace(/_/g, " ")}
                        </span>
                        <span
                          className={
                            l.entity_type === "SME"
                              ? "badge-gold"
                              : "badge-navy"
                          }
                        >
                          {l.entity_type}
                        </span>
                        {l.confidence_label && (
                          <ConfidencePill label={l.confidence_label} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verdict */}
                  {l.verdict && (
                    <p className="text-sm text-navy font-medium mb-2 italic">
                      "{l.verdict}"
                    </p>
                  )}

                  <p className="text-muted text-sm line-clamp-2 leading-relaxed mb-3">
                    {l.summary}
                  </p>

                  {/* Why this deal */}
                  {l.why_this_deal?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {l.why_this_deal.map((w) => (
                        <span
                          key={w}
                          className="text-xs bg-navy/8 text-navy px-2.5 py-1 font-medium"
                        >
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-olive" />

                            <span>{w}</span>
                          </div>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Score + metrics row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-4 text-xs text-dim flex-wrap">
                      {l.location_city && (
                        <span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />

                            {l.location_city}
                          </span>
                        </span>
                      )}
                      <span>{l._count?.interests || 0} interests</span>
                      {l.total_score !== undefined && (
                        <span>
                          Score:{" "}
                          <span className="font-mono font-semibold text-navy">
                            {l.total_score}
                          </span>
                          /100
                        </span>
                      )}
                      {l.matchScore !== undefined && (
                        <span>
                          Match:{" "}
                          <span className="font-mono font-semibold text-gold">
                            {l.matchScore}%
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-semibold text-goldD text-sm">
                      {formatINR(l.funding_ask)}
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
