import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listingAPI, scoreAPI } from "../../api/index.js";
import {
  PageHeader,
  Spinner,
  ScoreRing,
  GradeBadge,
  EmptyState,
  Alert,
} from "../../components/ui/index.jsx";

export default function ScoresHub() {
  const [listings, setListings] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listingAPI
      .getAll()
      .then(async (r) => {
        const list = r.data.data || [];
        setListings(list);

        if (list.length === 0) return;

        // Fetch scores one by one — don't fail all if one errors
        const scoreMap = {};
        for (const l of list) {
          try {
            const res = await scoreAPI.getScore(l.id);
            scoreMap[l.id] = res.data.data;
          } catch {
            // Score fetch failed for this listing — show "Not scored"
          }
        }
        setScores(scoreMap);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load listings");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="anim-up">
      <PageHeader
        title="Scores & Reports"
        subtitle={`${listings.length} listing${listings.length !== 1 ? "s" : ""} · KuberList readiness scores`}
      />

      <Alert type="error" message={error} onClose={() => setError("")} />

      {listings.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No listings yet"
          description="Create a listing to get your readiness score."
          action={
            <Link to="/seeker/listings/new" className="btn-navy inline-flex">
              Create Listing →
            </Link>
          }
        />
      ) : (
        <div className="space-y-4 stagger">
          {listings.map((l) => {
            const score = scores[l.id];
            return (
              <div key={l.id} className="card flex items-center gap-6">
                <div className="flex-shrink-0">
                  {score ? (
                    <ScoreRing score={score} size={80} />
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-border flex items-center justify-center text-dim text-xs text-center leading-tight px-2">
                      Click Score Details
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display text-lg font-semibold text-navy">
                      {l.name}
                    </h3>
                    {score ? (
                      <GradeBadge grade={score.grade} />
                    ) : (
                      <span className="badge-gray">Not scored yet</span>
                    )}
                    <span className="badge-gray">{l.status}</span>
                  </div>
                  <p className="text-muted text-sm line-clamp-1">{l.summary}</p>
                  {score && (
                    <div className="flex gap-4 mt-2 text-xs text-dim flex-wrap">
                      <span>Traction: {score.traction_score}/30</span>
                      <span>Financials: {score.financial_score}/30</span>
                      <span>Narrative: {score.narrative_score}/40</span>
                      <span>Confidence: {score.confidence_score}%</span>
                      <span>Risk: {score.risk_score}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link
                    to={`/seeker/listings/${l.id}/score`}
                    className="btn-navy btn-sm"
                  >
                    Score Details
                  </Link>
                  <Link
                    to={`/seeker/listings/${l.id}/report`}
                    className="btn-outline btn-sm"
                  >
                    Full Report
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
