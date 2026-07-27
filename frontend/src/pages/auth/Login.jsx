import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { Alert, Spinner } from "../../components/ui/index.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(
        user.role === "INVESTOR"
          ? "/investor"
          : user.role === "ADMIN"
            ? "/admin"
            : "/seeker",
      );
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between p-14 bg-navy relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle,#CEAE5E 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-3 mb-14">
            <img
              src="/logo.png"
              alt="KuberList"
              className="w-9 h-9 object-contain"
            />
            <span className="font-display text-xl font-semibold text-white">
              KuberList
            </span>
          </Link>
          <h1 className="font-display text-5xl font-semibold text-white leading-[1.15] mb-5">
            India's Capital
            <br />
            <span className="text-gold italic">Discovery</span>
            <br />
            Marketplace
          </h1>
          <p className="text-white/45 text-base leading-relaxed max-w-sm">
            Connecting startups & SMEs with Angels, Micro VCs, Family Offices,
            and Corporate investors.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-3">
          {[
            ["Secure", "Document Sharing"],
            ["Curated", "Investor Network"],
            ["Explainable", "Startup Scoring"],
            ["India", "Focused"],
          ].map(([v, l]) => (
            <div key={l} className="border border-white/10 p-4 bg-white/5">
              <p className="font-mono text-xl font-bold text-gold">{v}</p>
              <p className="text-xs text-white/30 mt-1 uppercase tracking-wider">
                {l}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white min-h-screen">
        <div className="w-full max-w-sm anim-up">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <img
              src="/logo.png"
              alt="KuberList"
              className="w-7 h-7 object-contain"
            />
            <span className="font-display text-lg font-semibold text-navy">
              KuberList
            </span>
          </Link>
          <h2 className="font-display text-3xl font-semibold text-navy mb-1">
            Welcome back
          </h2>
          <p className="text-muted text-sm mb-8">
            Sign in to your KuberList account
          </p>
          <Alert type="error" message={error} onClose={() => setError("")} />
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="input"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="input"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-navy w-full py-3 mt-1"
            >
              {loading ? (
                <>
                  <Spinner size="sm" /> Signing in…
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>
          <p className="text-center text-sm text-muted mt-6">
            No account?{" "}
            <Link
              to="/register"
              className="text-navy font-semibold hover:text-navyD transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
