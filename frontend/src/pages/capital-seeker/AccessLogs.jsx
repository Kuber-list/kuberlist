import { useEffect, useState } from 'react';
import { listingAPI, accessLogAPI } from '../../api/index.js';
import { PageHeader, Spinner, EmptyState, formatDate } from '../../components/ui/index.jsx';

export default function AccessLogs() {
  const [listings,   setListings]   = useState([]);
  const [logs,       setLogs]       = useState([]);
  const [selListing, setSelListing] = useState('');
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    listingAPI.getAll().then(r => {
      setListings(r.data.data);
      if (r.data.data.length > 0) setSelListing(r.data.data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selListing) return;
    accessLogAPI.getLogs(selListing).then(r => setLogs(r.data.data)).catch(() => setLogs([]));
  }, [selListing]);

  return (
    <div className="anim-up">
      <PageHeader title="Document Access Logs" subtitle="See which investors viewed your private documents" />

      <div className="card border-navy/20 bg-navy/5 mb-5 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">👁️</span>
        <div>
          <p className="text-sm font-semibold text-navy mb-0.5">Private document access only</p>
          <p className="text-xs text-muted leading-relaxed">Only logs when an investor with an <strong>accepted interest</strong> views your private documents. Public document views are not tracked.</p>
        </div>
      </div>

      {listings.length > 1 && (
        <div className="mb-5">
          <label className="label">Select Listing</label>
          <select value={selListing} onChange={e => setSelListing(e.target.value)} className="select max-w-xs">
            {listings.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon="📋" title="No document views yet"
          description="When an investor with accepted interest views your private documents, it will appear here." />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                {['Document','Investor','Category / Fund','Viewed At'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-muted uppercase tracking-wider font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className={`border-b border-border/40 last:border-0 ${i%2===0?'':'bg-bg/40'}`}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-text text-xs">{log.document_name}</div>
                    <div className="text-dim text-xs">{log.document_type?.replace(/_/g,' ')}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-text text-xs">{log.investor_name}</div>
                    <div className="text-dim text-xs">{log.investor_email}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-xs text-text">{log.investor_category?.replace(/_/g,' ') || '—'}</div>
                    {log.fund_name && <div className="text-xs text-dim">{log.fund_name}</div>}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">{formatDate(log.viewed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
