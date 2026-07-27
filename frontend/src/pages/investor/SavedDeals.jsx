import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { investorAPI } from "../../api/index.js";
import {
  PageHeader,
  Spinner,
  EmptyState,
  formatINR,
  formatDate,
} from "../../components/ui/index.jsx";
import { ArrowRight, Trash2 } from "lucide-react";
export default function SavedDeals() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    investorAPI
      .getSaved()
      .then((r) => setSaved(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const unsave = async (startupId) => {
    try {
      await investorAPI.save(startupId);
      setSaved((prev) => prev.filter((s) => s.startup_id !== startupId));
    } catch {}
  };

  return (
    <div className="anim-up">
      <PageHeader
        title="Saved Deals"
        subtitle={`${saved.length} deal${saved.length !== 1 ? "s" : ""} saved`}
      />
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : saved.length === 0 ? (
        <EmptyState
          icon="★"
          title="No saved deals"
          description="Star listings while browsing to save them here for quick access."
          action={
            <Link to="/investor/discover" className="btn-navy inline-flex">
              <>
                Browse Deals
                <ArrowRight className="inline w-4 h-4 ml-1" />
              </>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3 stagger">
          {saved.map((s) => (
            <div key={s.id} className="card flex items-center gap-4 group">
              <div className="flex-1 min-w-0">
                <Link to={`/investor/listings/${s.startup_id}`}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display text-base font-semibold text-navy group-hover:text-gold transition-colors">
                      {s.startup?.name}
                    </h3>
                    <span className="badge-navy">{s.startup?.sector}</span>
                    <span
                      className={
                        s.startup?.entity_type === "SME"
                          ? "badge-gold"
                          : "badge-navy"
                      }
                    >
                      {s.startup?.entity_type}
                    </span>
                  </div>
                  <p className="text-muted text-sm line-clamp-1">
                    {s.startup?.summary}
                  </p>
                  <div className="flex gap-4 mt-1.5 text-xs text-dim flex-wrap">
                    <span>{s.startup?.stage?.replace(/_/g, " ")}</span>
                    <span>Seeking {formatINR(s.startup?.funding_ask)}</span>
                    <span>{s.startup?.capital_seeker?.name}</span>
                    <span>Saved {formatDate(s.created_at)}</span>
                  </div>
                </Link>
              </div>
              <button
                onClick={() => unsave(s.startup_id)}
                className="btn-ghost text-xs text-dim hover:text-red-500 flex-shrink-0"
                title="Remove from saved"
              >
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
                </>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
