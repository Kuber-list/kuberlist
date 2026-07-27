import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { interestAPI } from "../../api/index.js";
import {
  PageHeader,
  Spinner,
  StatusBadge,
  EmptyState,
  formatINR,
  formatDate,
} from "../../components/ui/index.jsx";
import { ArrowRight, MessageSquare } from "lucide-react";
export default function SentInterests() {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interestAPI
      .mine()
      .then((r) => setInterests(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const total = interests.length;
  const accepted = interests.filter((i) => i.status === "ACCEPTED").length;
  const pending = interests.filter((i) => i.status === "PENDING").length;

  return (
    <div className="anim-up">
      <PageHeader
        title="Sent Interests"
        subtitle={`${total} total · ${accepted} accepted · ${pending} pending`}
      />
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : interests.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="No interests sent"
          description="Browse deals and express interest to build your pipeline."
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
          {interests.map((i) => (
            <Link
              key={i.id}
              to={`/investor/listings/${i.startup_id || i.startup?.id}`}
              className="card-hover flex items-center gap-4 group block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-display text-base font-semibold text-navy group-hover:text-gold transition-colors">
                    {i.startup?.name}
                  </h3>
                  <StatusBadge status={i.status} />
                </div>
                <div className="flex gap-4 text-xs text-dim flex-wrap">
                  <span>{i.startup?.sector}</span>
                  <span>{i.startup?.stage?.replace(/_/g, " ")}</span>
                  <span>Seeking {formatINR(i.startup?.funding_ask)}</span>
                  {i.message && <span className="italic">"{i.message}"</span>}
                </div>
              </div>
              <div className="text-xs text-dim flex-shrink-0">
                {formatDate(i.created_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
