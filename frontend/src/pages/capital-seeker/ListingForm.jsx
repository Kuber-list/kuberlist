import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { listingAPI } from "../../api/index.js";
import { Alert, Spinner, PageHeader } from "../../components/ui/index.jsx";

const SECTORS = [
  "FinTech",
  "HealthTech",
  "AgriTech",
  "EdTech",
  "SaaS",
  "D2C",
  "CleanTech",
  "AI/ML",
  "DefenceTech",
  "LogiTech",
  "RetailTech",
  "ManufacTech",
  "PropTech",
  "Other",
];
const STAGES = ["idea", "pre_seed", "seed", "series_a", "series_b", "growth"];
const formatIndianNumber = (value) => {
  if (!value) return "";

  return Number(value).toLocaleString("en-IN");
};

const formatMoneyHint = (value) => {
  if (!value) return "";

  const v = Number(value);

  if (v >= 10000000) {
    return `${(v / 10000000).toFixed(2)} Cr`;
  }

  if (v >= 100000) {
    return `${(v / 100000).toFixed(2)} Lakh`;
  }

  return formatIndianNumber(v);
};
export default function ListingForm({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    sector: "",
    stage: "",
    entity_type: "STARTUP",
    location_city: "",
    location_country: "India",
    funding_ask: "",
    valuation_expectation: "",
    revenue_last_year: "",
    monthly_burn: "",
    requires_nda: false,
    summary: "",
    use_of_funds: "",
    // New credibility & traction fields
    has_purchase_orders: false,
    po_value: "",
    po_count: "",
    has_government_contract: false,
    has_ip: false,
    ip_description: "",
    awards_recognition: "",
    patent_number: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(mode === "edit");

  useEffect(() => {
    if (mode === "edit" && id) {
      listingAPI
        .getOne(id)
        .then((r) => {
          const l = r.data.data;
          setForm({
            name: l.name || "",
            sector: l.sector || "",
            stage: l.stage || "",
            entity_type: l.entity_type || "STARTUP",
            location_city: l.location_city || "",
            location_country: l.location_country || "India",
            funding_ask: l.funding_ask || "",
            valuation_expectation: l.valuation_expectation || "",
            revenue_last_year: l.revenue_last_year || "",
            monthly_burn: l.monthly_burn || "",
            requires_nda: l.requires_nda || false,
            summary: l.summary || "",
            use_of_funds: l.use_of_funds || "",
            has_purchase_orders: l.has_purchase_orders || false,
            po_value: l.po_value || "",
            po_count: l.po_count || "",
            has_government_contract: l.has_government_contract || false,
            has_ip: l.has_ip || false,
            ip_description: l.ip_description || "",
            awards_recognition: l.awards_recognition || "",
            patent_number: l.patent_number || "",
          });
        })
        .finally(() => setFetching(false));
    }
  }, [id, mode]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "create") {
        const r = await listingAPI.create(form);
        navigate(`/seeker/listings/${r.data.data.id}`);
      } else {
        await listingAPI.update(id, form);
        navigate(`/seeker/listings/${id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="anim-up max-w-2xl">
      <PageHeader
        title={mode === "create" ? "Create Listing" : "Edit Listing"}
        subtitle="Complete all sections for a higher readiness score"
        actions={
          <Link
            to={mode === "edit" ? `/seeker/listings/${id}` : "/seeker/listings"}
            className="btn-ghost"
          >
            ← Back
          </Link>
        }
      />
      <Alert type="error" message={error} onClose={() => setError("")} />

      <form onSubmit={submit} className="space-y-5">
        {/* ── Basic Info ── */}
        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border">
            Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Company / Project Name *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="input"
                placeholder="NexaPay"
                required
              />
            </div>
            <div>
              <label className="label">Sector *</label>
              <select
                value={form.sector}
                onChange={(e) => set("sector", e.target.value)}
                className="select"
                required
              >
                <option value="">Select sector</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Stage *</label>
              <select
                value={form.stage}
                onChange={(e) => set("stage", e.target.value)}
                className="select"
                required
              >
                <option value="">Select stage</option>
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Entity Type</label>
              <select
                value={form.entity_type}
                onChange={(e) => set("entity_type", e.target.value)}
                className="select"
              >
                <option value="STARTUP">Startup</option>
                <option value="SME">SME</option>
              </select>
            </div>
            <div>
              <label className="label">City</label>
              <input
                value={form.location_city}
                onChange={(e) => set("location_city", e.target.value)}
                className="input"
                placeholder="Mumbai"
              />
            </div>
          </div>
        </div>

        {/* ── Financials ── */}
        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border">
            Financial Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Funding Ask (₹)</label>

              <input
                type="number"
                min="0"
                value={form.funding_ask}
                onChange={(e) => set("funding_ask", e.target.value)}
                className="input"
                placeholder="5000000"
              />

              {form.funding_ask && (
                <p className="form-hint text-gold">
                  ₹{formatIndianNumber(form.funding_ask)} (
                  {formatMoneyHint(form.funding_ask)})
                </p>
              )}
            </div>
            <div>
              <label className="label">Valuation Expectation (₹)</label>

              <input
                type="number"
                min="0"
                value={form.valuation_expectation}
                onChange={(e) => set("valuation_expectation", e.target.value)}
                className="input"
                placeholder="25000000"
              />

              {form.valuation_expectation && (
                <p className="form-hint text-gold">
                  ₹{formatIndianNumber(form.valuation_expectation)} (
                  {formatMoneyHint(form.valuation_expectation)})
                </p>
              )}
            </div>
            <div>
              <label className="label">Revenue Last Year (₹)</label>
              <input
                type="number"
                min="0"
                value={form.revenue_last_year}
                onChange={(e) => set("revenue_last_year", e.target.value)}
                className="input"
                placeholder="1000000"
              />
              {form.revenue_last_year && (
                <p className="form-hint text-gold">
                  ₹{formatIndianNumber(form.revenue_last_year)} (
                  {formatMoneyHint(form.revenue_last_year)})
                </p>
              )}
            </div>
            <div>
              <label className="label">Monthly Burn (₹)</label>
              <input
                type="number"
                min="0"
                value={form.monthly_burn}
                onChange={(e) => set("monthly_burn", e.target.value)}
                className="input"
                placeholder="200000"
              />
              {form.monthly_burn && (
                <p className="form-hint text-gold">
                  ₹{formatIndianNumber(form.monthly_burn)} (
                  {formatMoneyHint(form.monthly_burn)})
                </p>
              )}
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requires_nda}
                  onChange={(e) => set("requires_nda", e.target.checked)}
                  className="h-4 w-4"
                />

                <div>
                  <p className="font-medium text-navy">
                    Require NDA before additional document sharing
                  </p>

                  <p className="text-xs text-muted">
                    Existing documents remain accessible. An NDA will only be
                    required before sharing additional documents requested by
                    investors.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ── Pitch ── */}
        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border">
            Your Pitch
          </h3>
          <div>
            <label className="label">
              Summary *{" "}
              <span className="text-muted normal-case font-normal">
                (mention market size, customers, TAM for better score)
              </span>
            </label>
            <textarea
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="Describe your business, the problem you solve, market size, current traction…"
              required
            />
            <p className="form-hint">
              {form.summary.length} chars — aim for 300+ for bonus points
            </p>
          </div>
          <div>
            <label className="label">Use of Funds</label>
            <textarea
              value={form.use_of_funds}
              onChange={(e) => set("use_of_funds", e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="How will you deploy this capital? Hiring, product, distribution…"
            />
          </div>
        </div>

        {/* ── Traction & Purchase Orders ── */}
        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border">
            Traction & Purchase Orders
            <span className="ml-2 text-gold text-xs normal-case font-normal">
              +15 pts potential
            </span>
          </h3>

          <div>
            <label className="label">
              Do you have confirmed Purchase Orders?
            </label>
            <div className="flex gap-3 mt-1">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => set("has_purchase_orders", v)}
                  className={`px-5 py-2 text-sm font-semibold border transition-all ${form.has_purchase_orders === v ? "border-navy bg-navy/8 text-navy" : "border-border text-muted hover:border-navy/30"}`}
                >
                  {v ? "✓ Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {form.has_purchase_orders && (
            <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-navy/20">
              <div>
                <label className="label">Total PO Value (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={form.po_value}
                  onChange={(e) => set("po_value", e.target.value)}
                  className="input"
                  placeholder="5000000"
                />
                {form.po_value && (
                  <p className="form-hint text-gold">
                    ₹{formatIndianNumber(form.po_value)} (
                    {formatMoneyHint(form.po_value)})
                  </p>
                )}
              </div>
              <div>
                <label className="label">Number of POs</label>
                <input
                  type="number"
                  min="1"
                  value={form.po_count}
                  onChange={(e) => set("po_count", e.target.value)}
                  className="input"
                  placeholder="3"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Credibility & Validation ── */}
        <div className="card space-y-5">
          <h3 className="font-display text-sm font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border">
            Credibility & Validation
            <span className="ml-2 text-gold text-xs normal-case font-normal">
              +15 pts potential
            </span>
          </h3>

          {/* Government Contract */}
          <div>
            <label className="label">
              Government Tender / Contract{" "}
              <span className="text-gold">+6 pts</span>
            </label>
            <div className="flex gap-3 mt-1">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => set("has_government_contract", v)}
                  className={`px-5 py-2 text-sm font-semibold border transition-all ${form.has_government_contract === v ? "border-olive bg-olive/8 text-oliveD" : "border-border text-muted hover:border-olive/30"}`}
                >
                  {v ? "✓ Yes" : "No"}
                </button>
              ))}
            </div>
            {form.has_government_contract && (
              <p className="text-xs text-olive mt-2">
                Great — government contracts are a strong credibility signal for
                investors.
              </p>
            )}
          </div>

          {/* IP */}
          <div>
            <label className="label">
              Intellectual Property (Patent / Trademark){" "}
              <span className="text-gold">+4 pts</span>
            </label>
            <div className="flex gap-3 mt-1">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => set("has_ip", v)}
                  className={`px-5 py-2 text-sm font-semibold border transition-all ${form.has_ip === v ? "border-navy bg-navy/8 text-navy" : "border-border text-muted hover:border-navy/30"}`}
                >
                  {v ? "✓ Yes" : "No"}
                </button>
              ))}
            </div>
            {form.has_ip && (
              <>
                <div className="mt-3">
                  <label className="label">IP Details</label>
                  <input
                    value={form.ip_description}
                    onChange={(e) => set("ip_description", e.target.value)}
                    className="input"
                    placeholder="Describe your patent, trademark, or IP"
                  />
                </div>

                <div className="mt-3">
                  <label className="label">Patent Number / Reference</label>
                  <input
                    value={form.patent_number}
                    onChange={(e) => set("patent_number", e.target.value)}
                    className="input"
                    placeholder="e.g. IN2024123456"
                  />
                </div>
              </>
            )}
          </div>

          {/* Awards */}
          <div>
            <label className="label">
              Awards / Accelerator / Recognition{" "}
              <span className="text-gold">+3 pts</span>
            </label>
            <input
              value={form.awards_recognition}
              onChange={(e) => set("awards_recognition", e.target.value)}
              className="input"
              placeholder="e.g. YC W24, TiE50 Winner, Startup India Certified, NASSCOM Top 10"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-navy flex items-center gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                {mode === "create" ? "Creating…" : "Saving…"}
              </>
            ) : mode === "create" ? (
              "Create Listing →"
            ) : (
              "Save Changes →"
            )}
          </button>
          <Link
            to={mode === "edit" ? `/seeker/listings/${id}` : "/seeker/listings"}
            className="btn-outline"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
