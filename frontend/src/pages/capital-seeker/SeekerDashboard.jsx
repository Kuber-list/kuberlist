import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seekerAPI } from '../../api/index.js';
import { StatCard, Spinner, StatusBadge, formatINR, formatDate } from '../../components/ui/index.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Icons } from "../../components/ui/icons";

export default function SeekerDashboard() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { seekerAPI.getDashboard().then(r => setData(r.data.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="anim-up">
      <div className="page-header">
        <h1 className="font-display text-3xl font-semibold text-navy">Welcome, <span className="text-gold italic">{user?.name?.split(' ')[0]}</span></h1>
        <p className="text-muted text-sm mt-1.5">Manage your listings and investor interactions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
       <StatCard
  label="Total Listings"
  value={data?.totalListings}
  icon={Icons.listings}
/>

<StatCard
  label="Total Interests"
  value={data?.totalInterests}
  icon={Icons.inbox}
  color="#CEAE5E"
/>

<StatCard
  label="Pending Interests"
  value={data?.pendingInterests}
  icon={Icons.clock}
  color="#677555"
/>

<StatCard
  label="Active Listings"
  value={data?.listings?.filter(l => l.status === 'ACTIVE').length || 0}
  icon={Icons.check}
  color="#022440"
/>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold text-navy">Your Listings</h2>
        <Link to="/seeker/listings/new" className="btn-navy btn-sm">+ New Listing</Link>
      </div>

      {!data?.listings?.length ? (
        <div className="card text-center py-16">
          <div className="flex justify-center mb-4 opacity-20">
  <Icons.listings size={48} strokeWidth={1.5} />
</div>
          <h3 className="font-display text-xl font-semibold text-navy mb-2">No listings yet</h3>
          <p className="text-muted text-sm mb-6">Create your first funding listing to start receiving investor interests.</p>
          <Link to="/seeker/listings/new" className="btn-navy inline-flex">Create Listing →</Link>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {data.listings.map(l => (
            <Link key={l.id} to={`/seeker/listings/${l.id}`} className="card-hover flex items-center justify-between gap-4 group block">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-display text-base font-semibold text-navy group-hover:text-gold transition-colors">{l.name}</h3>
                  <StatusBadge status={l.status} />
                  <span className="badge-gray">{l.entity_type}</span>
                </div>
                <p className="text-muted text-sm line-clamp-1">{l.summary}</p>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-dim flex-wrap">
                  <span>{l.sector}</span><span>{l.stage}</span>
                  <span>{formatINR(l.funding_ask)} ask</span>
                  <span>{l._count?.interests || 0} interests</span>
                  <div className="flex items-center gap-1">
  <Icons.eye size={13} strokeWidth={1.8} />
  <span>{l.view_count || 0} views</span>
</div>
                </div>
              </div>
              <span className="text-dim group-hover:text-gold transition-colors flex-shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}

      {data?.recentInterests?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold text-navy mb-4">Recent Interests</h2>
          <div className="space-y-3 stagger">
            {data.recentInterests.map(i => (
              <div key={i.id} className="card flex items-center gap-4">
                <div className="w-9 h-9 bg-gold/15 border border-gold/30 flex items-center justify-center text-goldD font-display font-bold text-sm flex-shrink-0">
                  {i.investor?.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text text-sm">{i.investor?.name}</p>
                  <p className="text-xs text-muted">{i.investor?.investorProfile?.investor_category?.replace(/_/g,' ')} · {i.startup?.name}</p>
                  {i.message && <p className="text-xs text-muted mt-0.5 italic truncate">"{i.message}"</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={i.status} />
                  <span className="text-xs text-dim">{formatDate(i.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
