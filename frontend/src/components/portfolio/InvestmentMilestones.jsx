import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  Alert,
  Modal,
} from "../ui/index.jsx";

const STATUS_OPTIONS = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "AT_RISK",
];

const PRIORITY_OPTIONS = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const EMPTY_FORM = {
  title: "",
  description: "",
  target_date: "",
  priority: "MEDIUM",
  status: "NOT_STARTED",
  progress: 0,
};

function formatLabel(value) {
  if (!value) return "";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "No target date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "No target date";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusIcon(status) {
  switch (status) {
    case "COMPLETED":
      return CheckCircle2;

    case "IN_PROGRESS":
      return Clock3;

    case "AT_RISK":
      return AlertTriangle;

    default:
      return Circle;
  }
}

function statusClass(status) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-50 text-green-700 border-green-200";

    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "AT_RISK":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function priorityClass(priority) {
  switch (priority) {
    case "CRITICAL":
      return "text-red-700";

    case "HIGH":
      return "text-orange-700";

    case "MEDIUM":
      return "text-amber-700";

    default:
      return "text-muted";
  }
}

function MilestoneForm({
  form,
  setForm,
  saving,
  error,
  onSubmit,
  onCancel,
  editing,
}) {
  return (
    <div className="space-y-5">
      {error && <Alert type="error" message={error} />}

      <div>
        <label className="label">Title</label>
        <input
          className="input"
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
          placeholder="e.g. Close next institutional funding round"
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[100px] resize-y"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Describe the strategic milestone and expected outcome."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Target Date</label>
          <input
            type="date"
            className="input"
            value={form.target_date}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                target_date: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <label className="label">Priority</label>
          <select
            className="input"
            value={form.priority}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                priority: event.target.value,
              }))
            }
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {formatLabel(priority)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Progress (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="input"
            value={form.progress}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                progress: event.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={onSubmit}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : editing
              ? "Save Changes"
              : "Create Milestone"}
        </button>
      </div>
    </div>
  );
}

export default function InvestmentMilestones({
  investmentId,
  milestones = [],
  canManage = true,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const orderedMilestones = useMemo(() => {
    return [...milestones].sort((a, b) => {
      const statusOrder = {
        AT_RISK: 0,
        IN_PROGRESS: 1,
        NOT_STARTED: 2,
        COMPLETED: 3,
      };

      const statusDifference =
        (statusOrder[a.status] ?? 99) -
        (statusOrder[b.status] ?? 99);

      if (statusDifference !== 0) return statusDifference;

      const aDate = a.target_date
        ? new Date(a.target_date).getTime()
        : Number.MAX_SAFE_INTEGER;

      const bDate = b.target_date
        ? new Date(b.target_date).getTime()
        : Number.MAX_SAFE_INTEGER;

      return aDate - bDate;
    });
  }, [milestones]);

  const openCreate = () => {
    setEditingMilestone(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (milestone) => {
    setEditingMilestone(milestone);
    setError("");

    setForm({
      title: milestone.title || "",
      description: milestone.description || "",
      target_date: milestone.target_date
        ? milestone.target_date.slice(0, 10)
        : "",
      priority: milestone.priority || "MEDIUM",
      status: milestone.status || "NOT_STARTED",
      progress: milestone.progress ?? 0,
    });

    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Milestone title is required.");
      return;
    }

    const progress = Number(form.progress);

    if (!Number.isInteger(progress) || progress < 0 || progress > 100) {
      setError("Progress must be a whole number between 0 and 100.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        target_date: form.target_date || null,
        priority: form.priority,
        status: form.status,
        progress,
      };

      if (editingMilestone) {
        await onUpdate?.(editingMilestone.id, payload);
      } else {
        await onCreate?.(payload);
      }

      setModalOpen(false);
      setEditingMilestone(null);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to save milestone.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.title}"?`)) {
      return;
    }

    try {
      setDeletingId(milestone.id);
      await onDelete?.(milestone.id);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to delete milestone.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold text-navy">
            Milestones
          </h3>
          <p className="mt-1 text-sm text-muted">
            Track strategic commitments, progress, and important portfolio outcomes.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn-primary inline-flex items-center justify-center gap-2"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Add Milestone
          </button>
        )}
      </div>

      {orderedMilestones.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-50">
            <Circle className="h-5 w-5 text-muted" />
          </div>

          <h4 className="font-medium text-navy">
            No milestones yet
          </h4>

          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Add strategic milestones to keep the investment relationship and
            company progress aligned.
          </p>

          {canManage && (
            <button
              type="button"
              className="btn-secondary mt-5 inline-flex items-center gap-2"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              Add First Milestone
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {orderedMilestones.map((milestone) => {
            const StatusIcon = statusIcon(milestone.status);
            const progress = Math.max(
              0,
              Math.min(100, Number(milestone.progress || 0)),
            );

            return (
              <div key={milestone.id} className="px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-navy">
                        {milestone.title}
                      </h4>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                          milestone.status,
                        )}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {formatLabel(milestone.status)}
                      </span>

                      <span
                        className={`text-xs font-medium ${priorityClass(
                          milestone.priority,
                        )}`}
                      >
                        {formatLabel(milestone.priority)} priority
                      </span>
                    </div>

                    {milestone.description && (
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                        {milestone.description}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                      <span>
                        Target:{" "}
                        <span className="font-medium text-navy">
                          {formatDate(milestone.target_date)}
                        </span>
                      </span>

                      {milestone.creator?.name && (
                        <span>
                          Set by:{" "}
                          <span className="font-medium text-navy">
                            {milestone.creator.name}
                          </span>
                        </span>
                      )}

                      {milestone.supporting_documents?.length > 0 && (
                        <span>
                          {milestone.supporting_documents.length} supporting{" "}
                          {milestone.supporting_documents.length === 1
                            ? "document"
                            : "documents"}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 max-w-2xl">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-muted">Progress</span>
                        <span className="font-medium text-navy">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-navy transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="btn-secondary inline-flex items-center gap-2"
                        onClick={() => openEdit(milestone)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn-secondary inline-flex items-center gap-2 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(milestone)}
                        disabled={deletingId === milestone.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === milestone.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
          }
        }}
        title={editingMilestone ? "Edit Milestone" : "Add Milestone"}
      >
        <MilestoneForm
          form={form}
          setForm={setForm}
          saving={saving}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          editing={Boolean(editingMilestone)}
        />
      </Modal>
    </section>
  );
}
