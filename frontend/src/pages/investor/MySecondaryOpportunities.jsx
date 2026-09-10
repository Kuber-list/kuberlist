import { useEffect, useState, useCallback } from "react";
import { secondaryOpportunityAPI } from "../../api/index.js";
import {
  PageHeader,
  Alert,
  Spinner,
  formatINR,
  formatDate,
} from "../../components/ui/index.jsx";

export default function MySecondaryOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interests, setInterests] = useState({});
  const [loadingInterests, setLoadingInterests] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [success, setSuccess] = useState("");

  const load = useCallback(() => {
    setLoading(true);

    secondaryOpportunityAPI
      .getMy()
      .then((r) => {
        setOpportunities(r.data.data || []);
      })
      .catch(() => {
        setError("Failed to load your secondary opportunities");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getStatusClass = (status) => {
    if (status === "LIVE") return "badge-olive";

    if (status === "PENDING_REVIEW") return "badge-gold";

    if (status === "REJECTED") return "badge-danger";

    return "badge-gray";
  };

  const formatStatus = (status) => {
    return status?.replace(/_/g, " ");
  };
  const handleViewInterests = async (opportunityId) => {
    if (interests[opportunityId]) {
      setInterests((prev) => {
        const updated = { ...prev };
        delete updated[opportunityId];
        return updated;
      });

      return;
    }

    setLoadingInterests(opportunityId);
    setError("");

    try {
      const response =
        await secondaryOpportunityAPI.getInterests(opportunityId);

      setInterests((prev) => ({
        ...prev,
        [opportunityId]: response.data.data || [],
      }));
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load interested investors",
      );
    } finally {
      setLoadingInterests(null);
    }
  };

  const handleInterestAction = async (opportunityId, interestId, action) => {
    setActionLoading(interestId);
    setError("");

    try {
      let response;

      if (action === "APPROVE") {
        response = await secondaryOpportunityAPI.approveInterest(
          opportunityId,
          interestId,
        );
      } else {
        response = await secondaryOpportunityAPI.declineInterest(
          opportunityId,
          interestId,
        );
      }

      const updatedInterest = response.data.data;

      setInterests((prev) => ({
        ...prev,
        [opportunityId]: prev[opportunityId].map((interest) =>
          interest.id === interestId ? updatedInterest : interest,
        ),
      }));

      setSuccess(
        action === "APPROVE"
          ? "Investor interest approved successfully."
          : "Investor interest declined.",
      );

      setTimeout(() => {
        setSuccess("");
      }, 4000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update investor interest",
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="anim-up">
      <PageHeader
        title="My Secondary Opportunities"
        subtitle={`${opportunities.length} opportunities created`}
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
            No Secondary Opportunities
          </h3>

          <p className="text-sm text-muted">
            You have not created any secondary opportunities yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {opportunities.map((opportunity) => {
            const companyName =
              opportunity.listing?.name ||
              opportunity.external_organization?.name ||
              "Unknown Organization";

            return (
              <div key={opportunity.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-display text-base font-semibold text-navy">
                        {companyName}
                      </h3>

                      <span className={getStatusClass(opportunity.status)}>
                        {formatStatus(opportunity.status)}
                      </span>

                      <span className="badge-gray">
                        {opportunity.sale_type === "FULL"
                          ? "Full Stake"
                          : "Partial Stake"}
                      </span>
                    </div>

                    <div className="flex gap-4 text-xs text-dim flex-wrap">
                      <span>
                        Asking Price:{" "}
                        {opportunity.price_visibility === "ON_REQUEST"
                          ? "On Request"
                          : formatINR(opportunity.asking_price)}
                      </span>

                      {opportunity.ownership_percentage && (
                        <span>Stake: {opportunity.ownership_percentage}%</span>
                      )}

                      <span>
                        Instrument: {opportunity.instrument?.replace(/_/g, " ")}
                      </span>

                      <span>Updated: {formatDate(opportunity.updated_at)}</span>
                    </div>

                    {opportunity.rejection_reason && (
                      <div className="mt-3 text-sm">
                        <span className="font-medium text-danger">
                          Rejection reason:
                        </span>{" "}
                        <span className="text-muted">
                          {opportunity.rejection_reason}
                        </span>
                      </div>
                    )}

                    {opportunity.notes && (
                      <div className="mt-3 text-sm text-muted">
                        {opportunity.notes}
                      </div>
                    )}
                    {opportunity.status === "LIVE" && (
                      <div className="mt-5 pt-4 border-t border-border">
                        <button
                          type="button"
                          onClick={() => handleViewInterests(opportunity.id)}
                          disabled={loadingInterests === opportunity.id}
                          className="btn-outline w-full"
                        >
                          {loadingInterests === opportunity.id
                            ? "Loading..."
                            : interests[opportunity.id]
                              ? "Hide Interested Investors"
                              : "View Interested Investors"}
                        </button>

                        {interests[opportunity.id] && (
                          <div className="mt-4 space-y-3">
                            {interests[opportunity.id].length === 0 ? (
                              <div className="text-sm text-muted text-center py-4">
                                No investors have expressed interest yet.
                              </div>
                            ) : (
                              interests[opportunity.id].map((interest) => (
                                <div
                                  key={interest.id}
                                  className="border border-border rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h4 className="font-medium text-navy">
                                        {interest.investor?.name ||
                                          "Unknown Investor"}
                                      </h4>

                                      <p className="text-xs text-dim mt-1">
                                        {interest.investor?.email}
                                      </p>
                                    </div>

                                    <span className="badge-gray">
                                      {formatStatus(interest.status)}
                                    </span>
                                  </div>

                                  {interest.message && (
                                    <p className="text-sm text-muted mt-3">
                                      {interest.message}
                                    </p>
                                  )}

                                  <p className="text-xs text-dim mt-3">
                                    Expressed interest:{" "}
                                    {formatDate(interest.created_at)}
                                  </p>
                                  {interest.status === "EXPRESSED" && (
                                    <div className="flex gap-2 mt-4">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleInterestAction(
                                            opportunity.id,
                                            interest.id,
                                            "APPROVE",
                                          )
                                        }
                                        disabled={actionLoading === interest.id}
                                        className="btn-olive flex-1 btn-sm"
                                      >
                                        {actionLoading === interest.id
                                          ? "Processing..."
                                          : "Approve"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleInterestAction(
                                            opportunity.id,
                                            interest.id,
                                            "DECLINE",
                                          )
                                        }
                                        disabled={actionLoading === interest.id}
                                        className="btn-danger flex-1 btn-sm"
                                      >
                                        {actionLoading === interest.id
                                          ? "Processing..."
                                          : "Decline"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
