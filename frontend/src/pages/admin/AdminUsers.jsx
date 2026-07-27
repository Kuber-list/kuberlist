import { useEffect, useState } from 'react';
import { adminAPI } from '../../api/index.js';
import { PageHeader, Alert, Spinner, Pagination, formatDate } from '../../components/ui/index.jsx';

export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [pagination, setPagination] = useState({ page:1, total:0, pages:1 });
  const [loading,    setLoading]    = useState(true);
  const [role,       setRole]       = useState('');
  const [page,       setPage]       = useState(1);
  const [error,      setError]      = useState('');

  useEffect(() => {
    setLoading(true);
    adminAPI.users({ role, page, limit: 20 })
      .then(r => { setUsers(r.data.data.users); setPagination(r.data.data.pagination); })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [role, page]);

  const ROLE_COLORS = { CAPITAL_SEEKER: 'badge-navy', INVESTOR: 'badge-gold', ADMIN: 'badge-olive' };

  return (
    <div className="anim-up">
      <PageHeader title="User Management" subtitle={`${pagination.total} registered users`} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="flex gap-2 mb-5">
        {[['','All Roles'],['CAPITAL_SEEKER','Capital Seekers'],['INVESTOR','Investors'],['ADMIN','Admins']].map(([v,l]) => (
          <button key={v} onClick={() => { setRole(v); setPage(1); }}
            className={`px-4 py-1.5 text-xs font-semibold border transition-all duration-150 ${role===v?'border-navy bg-navy/10 text-navy':'border-border text-muted hover:border-navy/30'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  {['User','Role','Listings','Joined'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs text-muted uppercase tracking-wider font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={`border-b border-border/40 last:border-0 ${i%2===0?'':'bg-bg/40'}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-gold/10 border border-gold/25 flex items-center justify-center text-goldD font-display font-bold text-xs flex-shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-text">{u.name}</div>
                          <div className="text-xs text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className={ROLE_COLORS[u.role]||'badge-gray'}>{u.role?.replace(/_/g,' ')}</span></td>
                    <td className="px-5 py-3 font-mono text-sm text-muted">{u._count?.listings ?? 0}</td>
                    <td className="px-5 py-3 text-xs text-muted">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
