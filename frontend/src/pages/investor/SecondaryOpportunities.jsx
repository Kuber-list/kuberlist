import { useEffect, useState } from "react";
import { secondaryOpportunityAPI } from "../../api/index.js";
import {
  PageHeader,
  Alert,
  Spinner,
  formatINR,
} from "../../components/ui/index.jsx";

export default function SecondaryOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    secondaryOpportunityAPI
      .getLive()
      .then((r) => {
        setOpportunities(r.data.data || []);
      })
      .catch(() => {
        setError("Failed to load secondary opportunities");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  const handleExpressInterest = async (opportunity) => {
    setSubmittingId(opportunity.id);
    setError("");

    try {
      await secondaryOpportunityAPI.expressInterest(opportunity.id);

      setSuccess("Interest expressed successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to express interest");
    } finally {
      setSubmittingId(null);
    }
  };
  return (
    <div className="anim-up">
      <PageHeader
        title="Secondary Opportunities"
        subtitle="Explore available investment stakes and secondary transactions"
      />

      <Alert type="error" message={error} onClose={() => setError("")} />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="font-display text-base font-semibold text-navy mb-2">
            No Secondary Opportunities Available
          </h3>

          <p className="text-sm text-muted">
            There are currently no live secondary investment opportunities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger">
          {opportunities.map((opportunity) => {
            const companyName =
              opportunity.listing?.name ||
              opportunity.external_organization?.name ||
              "Unknown Organization";

            return (
              <div key={opportunity.id} className="card">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-navy">
                      {companyName}
                    </h2>

                    {opportunity.listing?.sector && (
                      <p className="text-xs text-dim mt-1">
                        {opportunity.listing.sector}
                      </p>
                    )}
                  </div>

                  <span className="badge-olive">LIVE</span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted">Sale Type</span>

                    <span className="font-medium text-navy">
                      {opportunity.sale_type === "FULL"
                        ? "Full Stake"
                        : "Partial Stake"}
                    </span>
                  </div>

                  {opportunity.ownership_percentage && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Ownership Available</span>

                      <span className="font-medium text-navy">
                        {opportunity.ownership_percentage}%
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between gap-4">
                    <span className="text-muted">Investment Instrument</span>

                    <span className="font-medium text-navy">
                      {opportunity.instrument?.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-muted">Asking Price</span>

                    <span className="font-medium text-navy">
                      {opportunity.price_visibility === "ON_REQUEST"
                        ? "On Request"
                        : formatINR(opportunity.asking_price)}
                    </span>
                  </div>

                  {opportunity.minimum_transaction_size && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Minimum Transaction</span>

                      <span className="font-medium text-navy">
                        {formatINR(opportunity.minimum_transaction_size)}
                      </span>
                    </div>
                  )}
                </div>

                {opportunity.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted">{opportunity.notes}</p>
                  </div>
                )}
                <div className="mt-5 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleExpressInterest(opportunity)}
                    disabled={submittingId === opportunity.id}
                    className="btn-olive w-full"
                  >
                    {submittingId === opportunity.id
                      ? "Submitting..."
                      : "Express Interest"}
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
