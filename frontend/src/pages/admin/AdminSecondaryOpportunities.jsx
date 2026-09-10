import { useEffect, useState, useCallback } from "react";
import { secondaryOpportunityAPI } from "../../api/index.js";
import {
  PageHeader,
  Alert,
  Spinner,
  Modal,
  formatINR,
  formatDate,
} from "../../components/ui/index.jsx";

export default function AdminSecondaryOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);

    secondaryOpportunityAPI
      .getPending()
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

  useEffect(() => {
    load();
  }, [load]);

  const openConfirm = (opportunity, action) => {
    setConfirm({ opportunity, action });
    setReason("");
  };

  const review = async () => {
    if (!confirm) return;

    setSubmitting(true);

    try {
      if (confirm.action === "APPROVE") {
        await secondaryOpportunityAPI.approve(confirm.opportunity.id);

        setToast("Secondary opportunity approved successfully.");
      } else {
        await secondaryOpportunityAPI.reject(confirm.opportunity.id, reason);

        setToast("Secondary opportunity rejected.");
      }

      setConfirm(null);
      setReason("");

      setOpportunities((current) =>
        current.filter(
          (opportunity) => opportunity.id !== confirm.opportunity.id,
        ),
      );

      setTimeout(() => {
        setToast("");
      }, 4000);
    } catch {
      setError("Failed to review secondary opportunity");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="anim-up">
      <PageHeader
        title="Secondary Opportunities"
        subtitle={`${opportunities.length} opportunities pending review`}
      />

      <Alert type="success" message={toast} onClose={() => setToast("")} />

      <Alert type="error" message={error} onClose={() => setError("")} />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="card text-center py-12 text-muted text-sm">
          No secondary opportunities pending review.
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
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display text-base font-semibold text-navy">
                        {companyName}
                      </h3>

                      <span className="badge-gold">PENDING REVIEW</span>

                      <span className="badge-gray">
                        {opportunity.sale_type === "FULL"
                          ? "Full Stake"
                          : "Partial Stake"}
                      </span>
                    </div>

                    <div className="flex gap-4 text-xs text-dim flex-wrap">
                      <span>
                        Seller: {opportunity.seller?.name || "Unknown"}
                      </span>

                      <span>
                        Asking Price: {formatINR(opportunity.asking_price)}
                      </span>

                      {opportunity.ownership_percentage && (
                        <span>Stake: {opportunity.ownership_percentage}%</span>
                      )}

                      <span>
                        Instrument: {opportunity.instrument?.replace(/_/g, " ")}
                      </span>

                      <span>
                        Submitted: {formatDate(opportunity.updated_at)}
                      </span>
                    </div>

                    {opportunity.notes && (
                      <div className="mt-3 text-sm text-muted">
                        {opportunity.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openConfirm(opportunity, "APPROVE")}
                      className="btn-olive btn-sm"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => openConfirm(opportunity, "REJECT")}
                      className="btn-danger btn-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={
          confirm?.action === "APPROVE"
            ? "Approve Secondary Opportunity"
            : "Reject Secondary Opportunity"
        }
      >
        <p className="text-muted text-sm mb-4">
          {confirm?.action === "APPROVE" ? (
            <>
              Approving{" "}
              <strong className="text-navy">
                {confirm?.opportunity?.listing?.name ||
                  confirm?.opportunity?.external_organization?.name}
              </strong>{" "}
              will make this secondary opportunity live and discoverable to
              investors.
            </>
          ) : (
            <>
              Rejecting this secondary opportunity will prevent it from being
              published.
            </>
          )}
        </p>

        {confirm?.action === "REJECT" && (
          <div className="mb-5">
            <label className="label">Rejection Reason</label>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Explain why this opportunity cannot be approved."
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={review}
            disabled={submitting}
            className={`flex-1 flex items-center justify-center gap-2 ${
              confirm?.action === "APPROVE" ? "btn-olive" : "btn-danger"
            }`}
          >
            {submitting && <Spinner size="sm" />}

            {confirm?.action === "APPROVE" ? "Yes, Approve" : "Yes, Reject"}
          </button>

          <button
            onClick={() => setConfirm(null)}
            className="btn-outline flex-1"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
