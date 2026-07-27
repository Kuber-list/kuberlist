import { useEffect, useState } from 'react';
import { seekerAPI, interestAPI } from '../../api/index.js';
import { PageHeader, Spinner, Alert, StatusBadge, EmptyState, formatDate } from '../../components/ui/index.jsx';

export default function InterestInbox() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('ALL');

  const load = () => {
    setLoading(true);
    seekerAPI.getDashboard().then(r => setData(r.data.data)).catch(() => setError('Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleStatus = async (intId, status) => {
    try { await interestAPI.updateStatus(intId, status); load(); }
    catch (err) { setError(err.response?.data?.message || 'Failed to update status'); }
  };

  const allInterests = data?.listings?.flatMap(l => l.interests.map(i => ({ ...i, listingName: l.name }))) || [];
  const filtered = filter === 'ALL' ? allInterests : allInterests.filter(i => i.status === filter);

  return (
    <div className="anim-up">
      <PageHeader title="Interest Inbox" subtitle={`${allInterests.length} total interest expressions`} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['ALL','All'],['PENDING','Pending'],['ACCEPTED','Accepted'],['REJECTED','Rejected']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-1.5 text-xs font-semibold border transition-all duration-150 ${filter===v ? 'border-navy bg-navy/5 text-navy' : 'border-border text-muted hover:border-navy/30'}`}>
            {l} {v === 'ALL' ? `(${allInterests.length})` : `(${allInterests.filter(i=>i.status===v).length})`}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      : filtered.length === 0 ? <EmptyState icon="📬" title="No interests" description="Interests from investors will appear here once your listing is active." />
      : (
        <div className="space-y-3 stagger">
          {filtered.map(i => (
            <div key={i.id} className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-gold/15 border border-gold/30 flex items-center justify-center text-goldD font-display font-bold flex-shrink-0">
                {i.investor?.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-text">{i.investor?.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {i.investor?.investorProfile?.investor_category?.replace(/_/g,' ')}
                      {i.investor?.investorProfile?.fund_name && ` · ${i.investor.investorProfile.fund_name}`}
                    </p>
                    <p className="text-xs text-dim mt-0.5">Re: <span className="text-navy font-medium">{i.listingName}</span></p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={i.status} />
                    <span className="text-xs text-dim">{formatDate(i.created_at)}</span>
                  </div>
                </div>
                {i.message && (
                  <div className="mt-2 p-3 bg-bg border border-border">
                    <p className="text-sm text-muted italic leading-relaxed">"{i.message}"</p>
                  </div>
                )}
                {i.status === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleStatus(i.id, 'ACCEPTED')} className="btn-olive btn-sm">✓ Accept</button>
                    <button onClick={() => handleStatus(i.id, 'REJECTED')} className="btn-danger btn-sm">✕ Reject</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
