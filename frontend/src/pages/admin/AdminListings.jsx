import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../api/index.js';
import { PageHeader, Alert, Spinner, StatusBadge, Modal, Pagination, formatINR, formatDate } from '../../components/ui/index.jsx';

export default function AdminListings() {
  const [searchParams] = useSearchParams();
  const [listings,   setListings]   = useState([]);
  const [pagination, setPagination] = useState({ page:1, total:0, pages:1 });
  const [loading,    setLoading]    = useState(true);
  const [status,     setStatus]     = useState(searchParams.get('status') || '');
  const [page,       setPage]       = useState(1);
  const [error,      setError]      = useState('');
  const [toast,      setToast]      = useState('');
  const [confirm,    setConfirm]    = useState(null); // { listing, action }
  const [reason,     setReason]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.listings({ status, page, limit: 15 })
      .then(r => { setListings(r.data.data.listings); setPagination(r.data.data.pagination); })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const openConfirm = (listing, action) => {
    setConfirm({ listing, action });
    setReason('');
  };

  const review = async () => {
    if (!confirm) return;
    setSubmitting(true);
    try {
      await adminAPI.review(confirm.listing.id, confirm.action, reason);
      setToast(`Listing ${confirm.action === 'ACTIVE' ? 'approved' : 'deactivated'} successfully.`);
      setConfirm(null);
      setReason('');
      load();
      setTimeout(() => setToast(''), 4000);
    } catch { setError('Failed to update listing'); }
    finally { setSubmitting(false); }
  };

  const STATUS_TABS = [['','All'],['UNDER_REVIEW','Under Review ⏳'],['ACTIVE','Active ✓'],['INACTIVE','Inactive'],['DRAFT','Draft']];

  return (
    <div className="anim-up">
      <PageHeader title="Listing Management" subtitle={`${pagination.total} total listings`} />
      <Alert type="success" message={toast} onClose={() => setToast('')} />
      <Alert type="error"   message={error} onClose={() => setError('')} />

      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_TABS.map(([v, l]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1); }}
            className={`px-4 py-1.5 text-xs font-semibold border transition-all duration-150 ${status===v?'border-navy bg-navy/10 text-navy':'border-border text-muted hover:border-navy/30'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : listings.length === 0 ? (
        <div className="card text-center py-12 text-muted text-sm">No listings found.</div>
      ) : (
        <>
          <div className="space-y-3 stagger">
            {listings.map(l => (
              <div key={l.id} className="card">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display text-base font-semibold text-navy">{l.name}</h3>
                      <StatusBadge status={l.status} />
                      <span className="badge-gray">{l.entity_type}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-dim flex-wrap">
                      <span>{l.sector}</span>
                      <span>{l.stage}</span>
                      <span>by {l.capital_seeker?.name}</span>
                      <span>{formatINR(l.funding_ask)} ask</span>
                      <span>{l._count?.interests||0} interests</span>
                      <span>👁 {l.view_count||0} views</span>
                      <span>{formatDate(l.created_at)}</span>
                    </div>
                    {/* Show rejection reason if inactive */}
                    {l.status === 'INACTIVE' && l.rejection_reason && (
                      <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 text-xs text-red-700">
                        <span className="font-semibold">Rejection reason:</span> {l.rejection_reason}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {l.status === 'UNDER_REVIEW' && <>
                      <button onClick={() => openConfirm(l, 'ACTIVE')}   className="btn-olive btn-sm">Approve</button>
                      <button onClick={() => openConfirm(l, 'INACTIVE')} className="btn-danger btn-sm">Reject</button>
                    </>}
                    {l.status === 'ACTIVE' && (
                      <button onClick={() => openConfirm(l, 'INACTIVE')} className="btn-danger btn-sm">Deactivate</button>
                    )}
                    {l.status === 'INACTIVE' && (
                      <button onClick={() => openConfirm(l, 'ACTIVE')}   className="btn-olive btn-sm">Reactivate</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)}
        title={`${confirm?.action === 'ACTIVE' ? 'Approve' : 'Reject'} Listing`}>
        <p className="text-muted text-sm mb-4">
          {confirm?.action === 'ACTIVE'
            ? <>Approving <strong className="text-navy">{confirm?.listing?.name}</strong> will make it discoverable to all investors.</>
            : <>Rejecting <strong className="text-navy">{confirm?.listing?.name}</strong> will remove it from discovery and notify the capital seeker.</>
          }
        </p>

        {/* Rejection reason field — only for deactivation */}
        {confirm?.action === 'INACTIVE' && (
          <div className="mb-5">
            <label className="label">Rejection Reason <span className="text-muted normal-case font-normal">(shown to capital seeker)</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="e.g. Insufficient financial details provided. Please add revenue figures and monthly burn rate before resubmitting."
            />
            <p className="form-hint">This message will be displayed on the capital seeker's listing page.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={review} disabled={submitting}
            className={`flex-1 flex items-center justify-center gap-2 ${confirm?.action==='ACTIVE'?'btn-olive':'btn-danger'}`}>
            {submitting && <Spinner size="sm" />}
            {confirm?.action === 'ACTIVE' ? 'Yes, Approve' : 'Yes, Reject'}
          </button>
          <button onClick={() => setConfirm(null)} className="btn-outline flex-1">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
