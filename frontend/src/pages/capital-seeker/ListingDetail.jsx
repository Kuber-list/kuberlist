import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listingAPI, interestAPI } from '../../api/index.js';
import { Alert, Spinner, StatusBadge, Modal, formatINR, formatDate, PageHeader } from '../../components/ui/index.jsx';

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');
  const [submitModal, setSubmitModal] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState('');

  const load = () => {
    setLoading(true);
    listingAPI.getOne(id).then(r => setListing(r.data.data)).catch(() => setError('Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try { await listingAPI.submit(id); setSuccess('Submitted for review!'); setSubmitModal(false); load(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to submit'); setSubmitModal(false); }
    finally { setSubmitting(false); }
  };

  const handleInterestStatus = async (intId, status) => {
    try { await interestAPI.updateStatus(intId, status); load(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to update'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!listing) return <Alert type="error" message={error || 'Listing not found'} />;

  return (
    <div className="anim-up">
      <PageHeader title={listing.name}
        subtitle={`${listing.sector} · ${listing.stage} · ${listing.entity_type}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            {['DRAFT', 'INACTIVE'].includes(listing.status) && (
              <button onClick={() => setSubmitModal(true)} className="btn-olive">
                {listing.status === 'INACTIVE' ? '↺ Resubmit for Review' : 'Submit for Review'}
              </button>
            )}
            <Link to={`/seeker/listings/${id}/edit`} className="btn-outline btn-sm">Edit</Link>
          </div>
        } />

      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error"   message={error}   onClose={() => setError('')} />
      {listing.status === 'INACTIVE' && listing.rejection_reason && (
        <div className="card border-red-200 bg-red-50 mb-5">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl flex-shrink-0">✕</span>
            <div>
              <h3 className="font-semibold text-red-700 text-sm mb-1">Listing Rejected by Admin</h3>
              <p className="text-red-600 text-sm leading-relaxed">{listing.rejection_reason}</p>
              <p className="text-red-500 text-xs mt-2">Please address the above and resubmit for review.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <StatusBadge status={listing.status} />
              <span className="badge-navy">{listing.entity_type}</span>
              {listing.location_city && <span className="text-xs text-muted">📍 {listing.location_city}</span>}
            </div>
            <p className="text-muted text-sm leading-relaxed">{listing.summary}</p>
          </div>
          {listing.use_of_funds && (
            <div className="card">
              <h3 className="font-display text-base font-semibold text-navy mb-3 pb-3 border-b border-border">Use of Funds</h3>
              <p className="text-muted text-sm leading-relaxed">{listing.use_of_funds}</p>
            </div>
          )}

          {/* Interests */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="font-display text-base font-semibold text-navy">Investor Interests ({listing.interests?.length || 0})</h3>
              <Link to="/seeker/inbox" className="text-xs text-gold hover:text-goldD font-medium">View Inbox →</Link>
            </div>
            {!listing.interests?.length ? (
              <p className="text-muted text-sm text-center py-6">No interests yet. Submit your listing for review to start receiving interests.</p>
            ) : (
              <div className="space-y-3">
                {listing.interests.map(i => (
                  <div key={i.id} className="flex items-start gap-3 p-3 bg-bg border border-border">
                    <div className="w-8 h-8 bg-gold/15 border border-gold/30 flex items-center justify-center text-goldD font-display font-bold text-xs flex-shrink-0">
                      {i.investor?.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text text-sm">{i.investor?.name}</p>
                      <p className="text-xs text-muted">{i.investor?.investorProfile?.investor_category?.replace(/_/g,' ')}</p>
                      {i.message && <p className="text-xs text-muted mt-1 italic">"{i.message}"</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={i.status} />
                      {i.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleInterestStatus(i.id, 'ACCEPTED')} className="btn-olive btn-xs">Accept</button>
                          <button onClick={() => handleInterestStatus(i.id, 'REJECTED')} className="btn-danger btn-xs">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Updates */}
          {listing.updates?.length > 0 && (
            <div className="card">
              <h3 className="font-display text-base font-semibold text-navy mb-4 pb-3 border-b border-border">Updates ({listing.updates.length})</h3>
              <div className="space-y-3">
                {listing.updates.map(u => (
                  <div key={u.id} className="p-3 bg-bg border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-text text-sm">{u.title}</p>
                      <span className="text-xs text-dim">{formatDate(u.created_at)}</span>
                    </div>
                    <p className="text-muted text-xs leading-relaxed">{u.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-display text-xs font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border">Key Details</h3>
            {[
              ['Funding Ask',    formatINR(listing.funding_ask)],
              ['Valuation',      formatINR(listing.valuation_expectation)],
              ['Revenue (LY)',   formatINR(listing.revenue_last_year)],
              ['Monthly Burn',   formatINR(listing.monthly_burn)],
              ['Views',         `${listing.view_count || 0} investor views`],
              ['Stage',         listing.stage],
              ['Location',      listing.location_city ? `${listing.location_city}, ${listing.location_country}` : listing.location_country],
              ['Listed On',     formatDate(listing.created_at)],
            ].map(([k,v]) => v && v !== '—' && (
              <div key={k} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="text-xs text-muted">{k}</span>
                <span className="text-xs text-text font-medium">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Link to="/seeker/documents" className="btn-outline w-full justify-center">📁 Manage Documents</Link>
            <Link to="/seeker/updates"   className="btn-outline w-full justify-center">📢 Post Update</Link>
          </div>
        </div>
      </div>

      {/* Submit modal */}
      <Modal open={submitModal} onClose={() => setSubmitModal(false)}
        title={listing.status === 'INACTIVE' ? 'Resubmit for Review' : 'Submit for Review'}>
        {listing.status === 'INACTIVE' && (
          <div className="bg-amber-50 border border-amber-200 p-3 mb-4 text-sm text-amber-700">
            ⚠️ Your listing was previously deactivated. Make sure you have addressed any issues before resubmitting.
          </div>
        )}
        <p className="text-muted text-sm mb-5">
          Once submitted, your listing will be reviewed by the KuberList team. After approval it will be visible to investors on the discovery page.
        </p>
        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={submitting} className="btn-olive flex-1 flex items-center justify-center gap-2">
            {submitting ? <><Spinner size="sm" />Submitting…</> : 'Yes, Submit →'}
          </button>
          <button onClick={() => setSubmitModal(false)} className="btn-outline flex-1">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
