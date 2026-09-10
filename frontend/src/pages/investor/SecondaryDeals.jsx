import { useEffect, useState, useCallback } from "react";

import { useNavigate } from "react-router-dom";
import { secondaryDealAPI } from "../../api/index.js";
import {
  PageHeader,
  Alert,
  Spinner,
  formatINR,
  formatDate,
} from "../../components/ui/index.jsx";

export default function SecondaryDeals() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const load = useCallback(() => {
    setLoading(true);
    setError("");

    secondaryDealAPI
      .getMy()
      .then((r) => {
        setDeals(r.data.data || []);
        setCurrentUserId(r.data.current_user_id || "");
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Failed to load secondary deals",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getCompanyName = (deal) => {
    const opportunity = deal.secondary_interest?.opportunity;

    return (
      opportunity?.listing?.name ||
      opportunity?.external_organization?.name ||
      "Unknown Organization"
    );
  };

  return (
    <div className="anim-up">
      <PageHeader
        title="Secondary Deals"
        subtitle={`${deals.length} active deals`}
      />

      <Alert type="error" message={error} onClose={() => setError("")} />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : deals.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="font-display text-base font-semibold text-navy mb-2">
            No Secondary Deals
          </h3>

          <p className="text-sm text-muted">
            Approved secondary investment opportunities will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {deals.map((deal) => {
            const opportunity = deal.secondary_interest?.opportunity;

            const companyName = getCompanyName(deal);

            const isSeller = deal.seller?.id === currentUserId;

            const otherParty = isSeller ? deal.buyer : deal.seller;

            return (
              <div
                key={deal.id}
                className="card cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-display text-base font-semibold text-navy">
                        {companyName}
                      </h3>

                      {deal.status && (
                        <span className="badge-olive">
                          {deal.status.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    {opportunity?.listing?.sector && (
                      <p className="text-xs text-dim mb-3">
                        {opportunity.listing.sector}
                      </p>
                    )}

                    <div className="flex gap-4 text-xs text-dim flex-wrap">
                      <span>
                        {isSeller ? "Buyer" : "Seller"}:{" "}
                        <span className="font-medium text-navy">
                          {otherParty?.name || "Unknown User"}
                        </span>
                      </span>

                      {opportunity?.asking_price && (
                        <span>
                          Deal Value:{" "}
                          {opportunity.price_visibility === "ON_REQUEST"
                            ? "On Request"
                            : formatINR(opportunity.asking_price)}
                        </span>
                      )}

                      <span>Created: {formatDate(deal.created_at)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-outline btn-sm shrink-0"
                    onClick={() =>
                      navigate(`/investor/secondary-deals/${deal.id}`)
                    }
                  >
                    Open Deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
