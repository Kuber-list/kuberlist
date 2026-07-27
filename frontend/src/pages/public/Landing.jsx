import { Link } from "react-router-dom";

const STATS = [
  ["Secure", "Document Sharing"],
  ["Curated", "Investor Network"],
  ["Explainable", "Startup Scoring"],
  ["India", "Focused"],
];
const INVESTOR_TYPES = [
  "Micro Investors",
  "Angel Investors",
  "Syndicate Leads",
  "Micro VCs",
  "VC Funds",
  "Family Offices",
  "Corporate Investors",
];
const HOW = [
  {
    icon: "📝",
    role: "Capital Seeker",
    steps: [
      "Register & build your profile",
      "Create your funding listing",
      "Submit for review",
      "Receive & manage investor interests",
      "Share documents securely",
    ],
  },
  {
    icon: "🔍",
    role: "Investor",
    steps: [
      "Register & set your preferences",
      "Discover matched listings",
      "Save deals you like",
      "Express interest with a message",
      "Access documents post-acceptance",
    ],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg font-body">
      {/* Nav */}
      <nav className="bg-navy sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="KuberList"
              className="w-8 h-8 object-contain"
            />
            <span className="font-display text-xl font-semibold text-white">
              KuberList
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link to="/register" className="btn-gold btn-sm">
              Get Started →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-navy relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle,#CEAE5E 1px,transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gold/8 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 text-xs text-white/50 uppercase tracking-widest mb-6">
              India's Capital Discovery Marketplace
            </div>
            <h1 className="font-display text-5xl lg:text-6xl font-semibold text-white leading-[1.12] mb-6">
              Where Capital Meets
              <br />
              <span className="text-gold italic">Opportunity</span>
            </h1>
            <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-xl">
              KuberList connects startups and SMEs seeking capital with the
              right investors — from Angels to VC Funds — through smart matching
              and secure deal discovery.
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link
                to="/register?role=CAPITAL_SEEKER"
                className="btn-gold px-8 py-3 text-base"
              >
                List Your Startup →
              </Link>
              <Link to="/register?role=INVESTOR" className="investor-btn">
                I'm an Investor
              </Link>
            </div>
          </div>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 flex-shrink-0">
            {STATS.map(([v, l]) => (
              <div
                key={l}
                className="border border-white/10 bg-white/5 p-6 text-center"
              >
                <p className="font-mono text-3xl font-bold text-gold">{v}</p>
                <p className="text-xs text-white/40 uppercase tracking-wider mt-1">
                  {l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor types */}
      <section className="py-14 bg-navyD border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-6">
            Investor Types on KuberList
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {INVESTOR_TYPES.map((t) => (
              <span
                key={t}
                className="px-4 py-2 text-xs font-medium border border-white/20 text-white/70"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-semibold text-navy mb-3">
            How KuberList Works
          </h2>
          <p className="text-muted">
            A simple, transparent process from listing to deal discovery.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {HOW.map(({ icon, role, steps }) => (
            <div key={role} className="card">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <span className="text-3xl">{icon}</span>
                <h3 className="font-display text-xl font-semibold text-navy">
                  For {role}
                </h3>
              </div>
              <ol className="space-y-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-navy/10 border border-navy/20 flex items-center justify-center text-navy font-mono text-xs flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-muted text-sm leading-relaxed">
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl font-semibold text-white mb-4">
            Ready to Raise or Invest?
          </h2>
          <p className="text-white/50 mb-8">
            Start your fundraising journey with KuberList.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/register?role=CAPITAL_SEEKER"
              className="btn-gold px-8 py-3"
            >
              List Your Startup
            </Link>
            <Link to="/register?role=INVESTOR" className="investor-btn">
              Join as Investor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navyD py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="KuberList"
              className="w-6 h-6 object-contain opacity-60"
            />
            <span className="font-display text-white/40 text-sm">
              KuberList © {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/kuber-list"
              target="_blank"
              rel="noreferrer"
              className="text-white/30 hover:text-gold transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.98 3.5C4.98 4.604 4.104 5.5 3 5.5S1.02 4.604 1.02 3.5 1.896 1.5 3 1.5 4.98 2.396 4.98 3.5zM1.5 8h3V22h-3V8zm7 0h2.879v1.908h.041C11.82 8.938 13.28 8 15.154 8 19.078 8 20 10.292 20 14.033V22h-3v-6.656c0-1.588-.028-3.631-2.213-3.631-2.214 0-2.553 1.729-2.553 3.517V22h-3V8z" />
              </svg>
            </a>

            {/* Twitter/X */}
            <a
              href="https://x.com/Kuber_list"
              target="_blank"
              rel="noreferrer"
              className="text-white/30 hover:text-gold transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.847h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.153h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298L17.609 20.643z" />
              </svg>
            </a>

            {/* Mail */}
            <a
              href="mailto:contact@kuberlist.com"
              className="text-white/30 hover:text-gold transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 7L2 7" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
