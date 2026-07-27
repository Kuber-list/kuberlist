import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { investorAPI, listingAPI } from "../../api/index.js";
import {
  StatCard,
  Spinner,
  StatusBadge,
  formatINR,
  formatDate,
  GradeBadge,
} from "../../components/ui/index.jsx";
import {
  Handshake,
  ArrowUpRight,
  MessageSquare,
  CheckCircle2,
  Clock3,
  Bookmark,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.jsx";

const DECISION_COLORS = {
  STRONG_BUY: "#059669",
  INVESTIGATE: "#022440",
  WATCH: "#B45309",
  PASS: "#DC2626",
};
const DECISION_LABELS = {
  STRONG_BUY: "Strong Buy",
  INVESTIGATE: "Investigate",
  WATCH: "Watch",
  PASS: "Pass",
};

function ProfilePrompt() {
  return (
    <div className="card border-gold/40 bg-gold/5 mb-6">
      <div className="flex items-start gap-4">
        <div className="text-3xl flex-shrink-0">
          <Handshake className="w-8 h-8 text-gold flex-shrink-0" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-navy mb-1">
            Complete your investor profile
          </h3>
          <p className="text-muted text-sm mb-4">
            Set your preferences to get personalised deal ranking and
            recommendations.
          </p>
          <Link to="/investor/profile" className="btn-gold btn-sm">
            <>
              Set Up Profile
              <ArrowUpRight className="w-4 h-4 ml-1 inline" />
            </>
          </Link>
        </div>
      </div>
    </div>
  );
}

function isProfileEmpty(p) {
  return (
    !p ||
    (!p.investor_category && !p.preferred_sectors?.length && !p.ticket_min)
  );
}

export default function InvestorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      investorAPI.getDashboard(),
      investorAPI.getProfile(),
      listingAPI.browse({ sort: "ranked", limit: 6 }),
    ])
      .then(([dr, pr, lr]) => {
        setData(dr.data.data);
        setProfile(pr.data.data);
        setRanked(lr.data.data.listings || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  const profileEmpty = isProfileEmpty(profile);
  const stats = data?.interestStats || {};

  return (
    <div className="anim-up">
      <div className="page-header">
        <h1 className="font-display text-3xl font-semibold text-navy">
          Welcome,{" "}
          <span className="text-gold italic">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-muted text-sm mt-1.5">
          Your personalised deal intelligence dashboard
        </p>
      </div>

      {profileEmpty && <ProfilePrompt />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        <StatCard
          label="Interests Sent"
          value={stats.total || 0}
          icon={MessageSquare}
        />
        <StatCard
          label="Accepted"
          value={stats.accepted || 0}
          icon={CheckCircle2}
          color="#677555"
        />
        <StatCard
          label="Pending"
          value={stats.pending || 0}
          icon={Clock3}
          color="#CEAE5E"
        />
        <StatCard
          label="Saved Deals"
          value={data?.totalSaved || 0}
          icon={Bookmark}
          color="#022440"
        />
      </div>

      {/* Ranked feed */}
      {ranked.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-navy">
              {profileEmpty ? "Latest Listings" : "Ranked for You"}
            </h2>
            <Link
              to="/investor/discover"
              className="text-xs text-gold font-medium hover:text-goldD"
            >
              <>
                See all
                <ArrowRight className="inline w-4 h-4 ml-1" />
              </>
            </Link>
          </div>
          <div className="space-y-3 stagger">
            {ranked.map((l) => (
              <Link
                key={l.id}
                to={`/investor/listings/${l.id}`}
                className="card-hover group block"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display text-base font-semibold text-navy group-hover:text-gold transition-colors">
                        {l.name}
                      </h3>
                      {l.decision && (
                        <span
                          className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 border"
                          style={{
                            color: DECISION_COLORS[l.decision],
                            borderColor: DECISION_COLORS[l.decision],
                            background: `${DECISION_COLORS[l.decision]}12`,
                          }}
                        >
                          {DECISION_LABELS[l.decision]}
                        </span>
                      )}
                      {l.grade && <GradeBadge grade={l.grade} />}
                      {l.momentum_score >= 6 && (
                        <span className="text-xs font-bold text-amber-600">
                          <Zap className="w-4 h-4 text-amber-500" />
                        </span>
                      )}
                    </div>
                    {l.verdict && (
                      <p className="text-xs text-navy italic mb-1">
                        "{l.verdict}"
                      </p>
                    )}
                    <p className="text-muted text-xs line-clamp-1">
                      {l.summary}
                    </p>
                    {l.why_this_deal?.length > 0 && (
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {l.why_this_deal.slice(0, 2).map((w) => (
                          <span
                            key={w}
                            className="text-xs bg-navy/8 text-navy px-2 py-0.5"
                          >
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-olive" />

                              <span>{w}</span>
                            </div>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-semibold text-goldD text-sm">
                      {formatINR(l.funding_ask)}
                    </p>
                    {l.matchScore !== undefined && (
                      <p className="text-xs text-muted mt-0.5">
                        Match:{" "}
                        <span className="font-semibold text-navy">
                          {l.matchScore}%
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Interest pipeline */}
      {data?.interests?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-navy">
              Interest Pipeline
            </h2>
            <Link
              to="/investor/interests"
              className="text-xs text-gold font-medium hover:text-goldD"
            >
              <>
                View all
                <ArrowRight className="inline w-4 h-4 ml-1" />
              </>
            </Link>
          </div>
          <div className="space-y-3 stagger">
            {data.interests
              .filter((i) => i.status === "ACCEPTED")
              .slice(0, 3)
              .map((i) => (
                <Link
                  key={i.id}
                  to={`/investor/listings/${i.startup_id}`}
                  className="card-hover flex items-center gap-4 group block border-olive/25 bg-olive/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-sm font-semibold text-navy group-hover:text-gold transition-colors">
                        {i.startup?.name}
                      </h3>
                      <StatusBadge status={i.status} />
                    </div>
                    <p className="text-xs text-muted">
                      {i.startup?.sector} · {formatINR(i.startup?.funding_ask)}
                    </p>
                  </div>
                  <span className="text-xs text-olive font-semibold flex-shrink-0">
                    🔓 Docs Available →
                  </span>
                </Link>
              ))}
            {data.interests
              .filter((i) => i.status === "PENDING")
              .slice(0, 2)
              .map((i) => (
                <div
                  key={i.id}
                  className="card flex items-center gap-4 border-amber-200 bg-amber-50/40"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-sm font-semibold text-text">
                        {i.startup?.name}
                      </h3>
                      <StatusBadge status={i.status} />
                    </div>
                    <p className="text-xs text-muted">
                      {i.startup?.sector} · Awaiting response
                    </p>
                  </div>
                  <span className="text-xs text-dim flex-shrink-0">
                    {formatDate(i.created_at)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {!data?.interests?.length && !ranked.length && (
        <div className="card text-center py-16 border-dashed">
          <p className="text-4xl mb-3 opacity-20">🔍</p>
          <h3 className="font-display text-lg font-semibold text-navy mb-2">
            Start exploring deals
          </h3>
          <p className="text-muted text-sm mb-4">
            Browse active listings and express interest to build your pipeline.
          </p>
          <Link to="/investor/discover" className="btn-navy inline-flex">
            Browse Listings →
          </Link>
        </div>
      )}
    </div>
  );
}
