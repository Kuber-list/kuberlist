import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api/index.js';
import { StatCard, Spinner, Alert } from '../../components/ui/index.jsx';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    adminAPI.metrics().then(r => setMetrics(r.data.data)).catch(() => setError('Failed to load metrics')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="anim-up">
      <div className="page-header">
        <h1 className="font-display text-3xl font-semibold text-navy">Platform Overview</h1>
        <p className="text-muted text-sm mt-1.5">KuberList admin dashboard</p>
      </div>
      <Alert type="error" message={error} />
      {metrics && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
            <StatCard label="Total Users"      value={metrics.totalUsers}     icon="👥" />
            <StatCard label="Capital Seekers"  value={metrics.capitalSeekers} icon="🏢" color="#CEAE5E" />
            <StatCard label="Investors"        value={metrics.investors}      icon="💼" color="#677555" />
            <StatCard label="Total Interests"  value={metrics.totalInterests} icon="⭐" color="#022440" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Listings"   value={metrics.totalListings}  icon="📋" />
            <StatCard label="Active Listings"  value={metrics.activeListings} icon="✓"  color="#677555" sub="Live on platform" />
            <StatCard label="Under Review"     value={metrics.underReview}    icon="⏳" color="#CEAE5E" sub="Needs action" />
          </div>
        </>
      )}
      <h2 className="font-display text-xl font-semibold text-navy mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
        {[
          { to:'/admin/listings?status=UNDER_REVIEW', icon:'🔍', label:'Review Listings',  sub:`${metrics?.underReview||0} pending`, accent: metrics?.underReview > 0 },
          { to:'/admin/users',    icon:'👥', label:'Manage Users',    sub:`${metrics?.totalUsers||0} registered` },
          { to:'/admin/interests',icon:'⭐', label:'View Interests',  sub:`${metrics?.totalInterests||0} total` },
        ].map(item => (
          <Link key={item.to} to={item.to}
            className={`card-hover group ${item.accent ? 'border-amber-300 bg-amber-50/50' : ''}`}>
            <div className="text-3xl mb-3 opacity-50 group-hover:opacity-100 transition-opacity">{item.icon}</div>
            <div className="font-display text-base font-semibold text-navy group-hover:text-gold transition-colors">{item.label}</div>
            <div className="text-xs text-muted mt-1">{item.sub}</div>
            {item.accent && <div className="text-xs text-amber-600 font-semibold mt-2">Needs attention →</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
