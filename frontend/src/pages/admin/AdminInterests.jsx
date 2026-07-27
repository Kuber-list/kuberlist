import { useEffect, useState } from 'react';
import { adminAPI } from '../../api/index.js';
import { PageHeader, Alert, Spinner, StatusBadge, formatDate } from '../../components/ui/index.jsx';

export default function AdminInterests() {
  const [interests, setInterests] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [filter,    setFilter]    = useState('');

  useEffect(() => {
    adminAPI.interests().then(r => setInterests(r.data.data)).catch(() => setError('Failed to load')).finally(() => setLoading(false));
  }, []);

  const filtered = filter ? interests.filter(i => i.status === filter) : interests;

  return (
    <div className="anim-up">
      <PageHeader title="Interest Expressions" subtitle={`${interests.length} total across platform`} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="flex gap-2 mb-5 flex-wrap">
        {[['','All'],['PENDING','Pending'],['ACCEPTED','Accepted'],['REJECTED','Rejected']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-1.5 text-xs font-semibold border transition-all duration-150 ${filter===v?'border-navy bg-navy/10 text-navy':'border-border text-muted hover:border-navy/30'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-muted text-sm">No interest expressions found.</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                {['Investor','Listing','Capital Seeker','Status','Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-muted uppercase tracking-wider font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i, idx) => (
                <tr key={i.id} className={`border-b border-border/40 last:border-0 ${idx%2===0?'':'bg-bg/40'}`}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-text text-xs">{i.investor?.name}</div>
                    <div className="text-dim text-xs">{i.investor?.email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-text text-xs">{i.startup?.name}</div>
                    {i.message && <div className="text-dim text-xs italic truncate max-w-[140px]">"{i.message}"</div>}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{i.startup?.capital_seeker?.name}</td>
                  <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                  <td className="px-5 py-3 text-xs text-muted">{formatDate(i.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
