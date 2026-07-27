import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Alert, Spinner } from '../../components/ui/index.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const [form, setForm]       = useState({ name:'', email:'', password:'', role: params.get('role') || 'CAPITAL_SEEKER' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      navigate(user.role === 'INVESTOR' ? '/investor' : '/seeker');
    } catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8">
      <div className="w-full max-w-md anim-up">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-10">
          <img src="/logo.png" alt="KuberList" className="w-8 h-8 object-contain" />
          <span className="font-display text-xl font-semibold text-navy">KuberList</span>
        </Link>
        <h2 className="font-display text-3xl font-semibold text-navy text-center mb-1">Create your account</h2>
        <p className="text-muted text-sm text-center mb-8">Join India's capital discovery marketplace</p>

        <Alert type="error" message={error} onClose={() => setError('')} />

        <form onSubmit={submit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="label">I am joining as</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { r:'CAPITAL_SEEKER', icon:'🏢', label:'Capital Seeker', sub:'Raise capital for my business' },
                { r:'INVESTOR',       icon:'💼', label:'Investor',       sub:'Discover and fund deals' },
              ].map(({ r, icon, label, sub }) => (
                <button key={r} type="button" onClick={() => setForm(f=>({...f,role:r}))}
                  className={`border p-4 text-left transition-all duration-150 ${form.role===r ? 'border-navy bg-navy/5 text-navy' : 'border-border text-muted hover:border-navy/30 bg-white'}`}>
                  <div className="text-2xl mb-1.5">{icon}</div>
                  <div className="font-semibold text-sm">{label}</div>
                  <div className="text-xs opacity-55 mt-0.5 leading-tight">{sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Full Name</label>
            <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="input" placeholder="Your full name" required />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} className="input" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} className="input" placeholder="Minimum 8 characters" required />
          </div>
          <button type="submit" disabled={loading} className="btn-navy w-full py-3 mt-1">
            {loading ? <><Spinner size="sm" /> Creating account…</> : 'Create Account →'}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-6">
          Already have an account? <Link to="/login" className="text-navy font-semibold hover:text-navyD transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
