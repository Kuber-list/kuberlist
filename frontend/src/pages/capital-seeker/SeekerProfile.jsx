import { useEffect, useState } from "react";
import { seekerAPI, userAPI } from "../../api/index.js";
import { PageHeader, Alert, Spinner } from "../../components/ui/index.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { imageUrl } from "../../utils/image";
export default function SeekerProfile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    entity_type: "STARTUP",
    organisation_name: "",
    linkedin_url: "",
    experience_summary: "",
    city: "",
    country: "India",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  useEffect(() => {
    seekerAPI
      .getProfile()
      .then((r) => {
        const p = r.data.data;
        if (p)
          setForm({
            entity_type: p.entity_type || "STARTUP",
            organisation_name: p.organisation_name || "",
            linkedin_url: p.linkedin_url || "",
            experience_summary: p.experience_summary || "",
            city: p.city || "",
            country: p.country || "India",
          });
      })
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await seekerAPI.saveProfile(form);
      setSuccess("Profile saved!");
      setTimeout(() => setSuccess(""), 3000);
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
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="anim-up max-w-2xl">
      <PageHeader title="Profile" subtitle="Your capital seeker profile" />
      <Alert type="success" message={success} onClose={() => setSuccess("")} />
      <Alert type="error" message={error} onClose={() => setError("")} />

      <div className="card mb-5 flex items-center gap-4">
        <div className="relative">
          {user?.profile_image_url ? (
            <img
              src={imageUrl(user.profile_image_url)}
              alt={user?.name}
              className="w-16 h-16 rounded-full object-cover border border-gold/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-goldD font-display font-bold text-xl">
              {user?.name?.[0]}
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

      <form onSubmit={submit} className="card space-y-4">
        <h3 className="font-display text-sm font-semibold text-navy uppercase tracking-wider pb-3 border-b border-border">
          Organisation Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Entity Type</label>
            <select
              value={form.entity_type}
              onChange={(e) =>
                setForm((p) => ({ ...p, entity_type: e.target.value }))
              }
              className="select"
            >
              <option value="STARTUP">Startup</option>
              <option value="SME">SME</option>
            </select>
          </div>
          <div>
            <label className="label">Organisation Name</label>
            <input
              value={form.organisation_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, organisation_name: e.target.value }))
              }
              className="input"
              placeholder="Your company name"
            />
          </div>
          <div>
            <label className="label">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              className="input"
              placeholder="Mumbai"
            />
          </div>
          <div>
            <label className="label">Country</label>
            <input
              value={form.country}
              onChange={(e) =>
                setForm((p) => ({ ...p, country: e.target.value }))
              }
              className="input"
              placeholder="India"
            />
          </div>
        </div>
        <div>
          <label className="label">LinkedIn URL</label>
          <input
            type="url"
            value={form.linkedin_url}
            onChange={(e) =>
              setForm((p) => ({ ...p, linkedin_url: e.target.value }))
            }
            className="input"
            placeholder="https://linkedin.com/in/…"
          />
        </div>
        <div>
          <label className="label">Experience Summary</label>
          <textarea
            value={form.experience_summary}
            onChange={(e) =>
              setForm((p) => ({ ...p, experience_summary: e.target.value }))
            }
            rows={4}
            className="input resize-none"
            placeholder="Your background, domain expertise, past ventures…"
          />
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
