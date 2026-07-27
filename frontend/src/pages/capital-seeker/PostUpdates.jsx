import { useEffect, useState } from 'react';
import { listingAPI, updateAPI } from '../../api/index.js';
import { PageHeader, Alert, Spinner, EmptyState, formatDate } from '../../components/ui/index.jsx';

export default function PostUpdates() {
  const [listings, setListings]   = useState([]);
  const [updates,  setUpdates]    = useState([]);
  const [selListing, setSelListing] = useState('');
  const [form, setForm]   = useState({ title:'', content:'' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [success,setSuccess]= useState('');

  const loadListings = async () => {
    const r = await listingAPI.getAll();
    setListings(r.data.data);
    if (r.data.data.length > 0) setSelListing(r.data.data[0].id);
  };
  const loadUpdates = async (lid) => {
    if (!lid) return;
    const r = await updateAPI.forStartup(lid);
    setUpdates(r.data.data);
  };
  useEffect(() => { loadListings(); }, []);
  useEffect(() => { loadUpdates(selListing); }, [selListing]);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await updateAPI.post({ startup_id: selListing, title: form.title, content: form.content });
      setSuccess('Update posted!'); setForm({ title:'', content:'' });
      loadUpdates(selListing);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to post'); }
    finally { setSaving(false); }
  };

  return (
    <div className="anim-up max-w-2xl">
      <PageHeader title="Post Updates" subtitle="Share milestones and news with investors" />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error"   message={error}   onClose={() => setError('')} />

      {listings.length > 1 && (
        <div className="mb-5">
          <label className="label">Listing</label>
          <select value={selListing} onChange={e => setSelListing(e.target.value)} className="select max-w-xs">
            {listings.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      {selListing && (
        <form onSubmit={submit} className="card space-y-4 mb-6">
          <h3 className="font-display text-base font-semibold text-navy pb-3 border-b border-border">New Update</h3>
          <div>
            <label className="label">Title</label>
            <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} className="input" placeholder="e.g. Reached ₹10L ARR milestone" required />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea value={form.content} onChange={e => setForm(p=>({...p,content:e.target.value}))} rows={4} className="input resize-none"
              placeholder="Share what's happening — new customers, partnerships, product launches, team additions…" required />
          </div>
          <button type="submit" disabled={saving} className="btn-navy flex items-center gap-2">
            {saving ? <><Spinner size="sm" />Posting…</> : 'Post Update →'}
          </button>
        </form>
      )}

      <h3 className="font-display text-lg font-semibold text-navy mb-4">Previous Updates</h3>
      {updates.length === 0
        ? <EmptyState icon="📢" title="No updates yet" description="Post your first update to keep investors informed." />
        : (
          <div className="space-y-3 stagger">
            {updates.map(u => (
              <div key={u.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-text">{u.title}</h4>
                  <span className="text-xs text-dim">{formatDate(u.created_at)}</span>
                </div>
                <p className="text-muted text-sm leading-relaxed">{u.content}</p>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
