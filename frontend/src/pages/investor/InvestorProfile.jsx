import { useEffect, useState } from "react";
import { investorAPI, userAPI } from "../../api/index.js";
import { PageHeader, Alert, Spinner } from "../../components/ui/index.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { CheckCircle2, ArrowRight } from "lucide-react";
const CATEGORIES = [
  "MICRO_INVESTOR",
  "ANGEL",
  "SYNDICATE_LEAD",
  "MICRO_VC",
  "VC_FUND",
  "FAMILY_OFFICE",
  "CORPORATE",
];
const SECTORS = [
  "FinTech",
  "HealthTech",
  "AgriTech",
  "EdTech",
  "SaaS",
  "D2C",
  "CleanTech",
  "AI/ML",
  "LogiTech",
  "RetailTech",
  "ManufacTech",
  "PropTech",
];
const STAGES = ["idea", "pre_seed", "seed", "series_a", "series_b", "growth"];

export default function InvestorProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    investor_category: "ANGEL",
    fund_name: "",
    aum_range: "",
    ticket_min: "",
    ticket_max: "",
    preferred_sectors: [],
    preferred_stage: [],
    preferred_entity_type: "BOTH",
    geography_preference: "",
    lead_interest: false,
    co_invest_interest: false,
    board_seat_interest: false,
    bio: "",
    linkedin_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  useEffect(() => {
    investorAPI
      .getProfile()
      .then((r) => {
        if (r.data.data) setForm((f) => ({ ...f, ...r.data.data }));
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (field, val) =>
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(val)
        ? f[field].filter((v) => v !== val)
        : [...f[field], val],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await investorAPI.saveProfile(form);
      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };
  const uploadImage = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("image", file);

      const response = await userAPI.uploadProfileImage(formData);

      setUser({
        ...user,
        profile_image_url: response.data.data.profile_image_url,
      });

      setSuccess("Profile picture updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };
  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="anim-up max-w-2xl">
      <PageHeader
        title="Investor Profile"
        subtitle="Complete your profile to get better deal recommendations"
      />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />
      <Alert type="error" message={error} onClose={() => setError("")} />

      {/* Account card */}
      <div className="card mb-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.profile_image_url ? (
              <img
                src={`http://localhost:3001${user.profile_image_url}`}
                alt={user?.name}
                className="w-16 h-16 rounded-full object-cover border border-gold/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-goldD font-display font-bold text-xl">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}

            <label className="absolute -bottom-1 -right-1 cursor-pointer bg-navy text-white text-xs px-2 py-1 rounded">
              {uploadingImage ? "..." : "Edit"}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={uploadImage}
              />
            </label>
          </div>

          <div>
            <p className="font-semibold text-text">{user?.name}</p>

            <p className="text-muted text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border">
            Investor Identity
          </h3>
          <div>
            <label className="label">Investor Category</label>
            <select
              value={form.investor_category}
              onChange={(e) =>
                setForm((f) => ({ ...f, investor_category: e.target.value }))
              }
              className="select"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fund / Firm Name</label>
              <input
                value={form.fund_name || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fund_name: e.target.value }))
                }
                className="input"
                placeholder="Accel India"
              />
            </div>
            <div>
              <label className="label">AUM Range</label>
              <input
                value={form.aum_range || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, aum_range: e.target.value }))
                }
                className="input"
                placeholder="₹10Cr – ₹50Cr"
              />
            </div>
            <div>
              <label className="label">LinkedIn URL</label>
              <input
                type="url"
                value={form.linkedin_url || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, linkedin_url: e.target.value }))
                }
                className="input"
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <div>
              <label className="label">Geography Preference</label>
              <input
                value={form.geography_preference || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    geography_preference: e.target.value,
                  }))
                }
                className="input"
                placeholder="Pan India"
              />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              value={form.bio || ""}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="input resize-none"
              placeholder="Your investment background and expertise…"
            />
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-display text-sm font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border">
            Investment Preferences
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Ticket (₹)</label>
              <input
                type="number"
                min="0"
                value={form.ticket_min || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ticket_min: e.target.value }))
                }
                className="input"
                placeholder="500000"
              />
            </div>
            <div>
              <label className="label">Max Ticket (₹)</label>
              <input
                type="number"
                min="0"
                value={form.ticket_max || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ticket_max: e.target.value }))
                }
                className="input"
                placeholder="20000000"
              />
            </div>
          </div>
          <div>
            <label className="label">Preferred Entity Type</label>
            <div className="flex gap-3">
              {["STARTUP", "SME", "BOTH"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, preferred_entity_type: t }))
                  }
                  className={`px-4 py-2 text-xs font-semibold border transition-all duration-150 ${form.preferred_entity_type === t ? "border-navy bg-navy/10 text-navy" : "border-border text-muted hover:border-navy/30"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Preferred Sectors</label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle("preferred_sectors", s)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-all duration-150 ${form.preferred_sectors?.includes(s) ? "border-gold bg-gold/10 text-goldD" : "border-border text-muted hover:border-gold/40"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Preferred Stages</label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle("preferred_stage", s)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-all duration-150 ${form.preferred_stage?.includes(s) ? "border-navy bg-navy/10 text-navy" : "border-border text-muted hover:border-navy/30"}`}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Deal Interests</label>
            <div className="flex flex-wrap gap-3">
              {[
                ["lead_interest", "Lead Investor"],
                ["co_invest_interest", "Co-Invest"],
                ["board_seat_interest", "Board Seat"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, [k]: !f[k] }))}
                  className={`px-4 py-2 text-xs font-semibold border transition-all duration-150 ${form[k] ? "border-olive bg-olive/10 text-oliveD" : "border-border text-muted hover:border-olive/40"}`}
                >
                  <>
                    {form[k] && (
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    )}

                    {l}
                  </>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-navy flex items-center gap-2"
        >
          {saving ? (
            <>
              <Spinner size="sm" />
              Saving…
            </>
          ) : (
            "Save Profile →"
          )}
        </button>
      </form>
    </div>
  );
}
