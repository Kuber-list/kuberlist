import { useState } from "react";
import { Download, FileText, FolderOpen, Plus, Trash2 } from "lucide-react";

import { Alert, EmptyState, Modal } from "../ui/index.jsx";

import { documentAPI } from "../../api/index.js";

function formatDate(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value) {
  if (!value) return "";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getDocumentName(document) {
  return (
    document?.original_name ||
    document?.file_name ||
    document?.name ||
    document?.title ||
    "Document"
  );
}

function getDocumentType(document) {
  return (
    document?.document_type || document?.type || document?.category || "GENERAL"
  );
}

function getDocumentId(document) {
  return document?.id;
}

export default function InvestmentDocuments({
  documents = [],
  canManage = true,
  availableDocuments = [],
  onAdd,
  onRemove,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const portfolioDocumentIds = new Set(
    documents.map((item) => getDocumentId(item.document)),
  );

  const selectableDocuments = availableDocuments.filter(
    (document) => !portfolioDocumentIds.has(getDocumentId(document)),
  );

  const openAdd = () => {
    setSelectedDocumentId("");
    setCategory("GENERAL");
    setError("");
    setModalOpen(true);
  };

  const handleAdd = async () => {
    if (!selectedDocumentId) {
      setError("Please select a document.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await onAdd?.({
        document_id: selectedDocumentId,
        category: category.trim() || "GENERAL",
      });

      setModalOpen(false);
      setSelectedDocumentId("");
      setCategory("GENERAL");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to add document.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (portfolioDocument) => {
    const documentName = getDocumentName(portfolioDocument.document);

    if (!window.confirm(`Remove "${documentName}" from this portfolio?`)) {
      return;
    }

    try {
      setDeletingId(portfolioDocument.id);
      setError("");
      await onRemove?.(getDocumentId(portfolioDocument.document));
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to remove document.",
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
            Documents
          </h3>
          <p className="mt-1 text-sm text-muted">
            Important documents linked to this investment and its ongoing
            relationship.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn-primary inline-flex items-center justify-center gap-2"
            onClick={openAdd}
          >
            <Plus className="h-4 w-4" />
            Add Document
          </button>
        )}
      </div>

      {error && (
        <div className="px-6 pt-5">
          <Alert type="error" message={error} />
        </div>
      )}

      {documents.length === 0 ? (
        <div className="px-6">
          <EmptyState
            icon="📄"
            title="No portfolio documents"
            description="Link relevant existing company documents here so they are easy to access after the investment."
            action={
              canManage ? (
                <button
                  type="button"
                  className="btn-secondary inline-flex items-center gap-2"
                  onClick={openAdd}
                >
                  <Plus className="h-4 w-4" />
                  Add Document
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {documents.map((portfolioDocument) => {
            const document = portfolioDocument.document || {};
            const documentName = getDocumentName(document);
            const documentType = getDocumentType(document);

            return (
              <div
                key={portfolioDocument.id}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    <FileText className="h-5 w-5 text-navy" />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-medium text-navy">
                      {documentName}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                      <span>{formatLabel(documentType)}</span>

                      {portfolioDocument.category && (
                        <span>
                          Portfolio category:{" "}
                          {formatLabel(portfolioDocument.category)}
                        </span>
                      )}

                      <span>
                        Added {formatDate(portfolioDocument.created_at)}
                      </span>
                    </div>

                    {portfolioDocument.addedBy?.name && (
                      <div className="mt-1 text-xs text-muted">
                        Added by {portfolioDocument.addedBy.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center gap-2"
                    onClick={() =>
                      documentAPI.download(getDocumentId(document))
                    }
                  >
                    <Download className="h-4 w-4" />
                    Open
                  </button>

                  {canManage && (
                    <button
                      type="button"
                      className="btn-secondary inline-flex items-center gap-2 text-red-600 hover:text-red-700"
                      onClick={() => handleRemove(portfolioDocument)}
                      disabled={deletingId === portfolioDocument.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === portfolioDocument.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
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
        title="Add Portfolio Document"
      >
        <div className="space-y-5">
          {error && <Alert type="error" message={error} />}

          {selectableDocuments.length === 0 ? (
            <div className="rounded-lg border border-border bg-gray-50 p-5 text-center">
              <FolderOpen className="mx-auto mb-2 h-6 w-6 text-muted" />

              <p className="text-sm font-medium text-navy">
                No additional documents available
              </p>

              <p className="mt-1 text-xs text-muted">
                Existing company documents will appear here once they are
                available and have not already been linked to this investment.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="label">Document</label>

                <select
                  className="input"
                  value={selectedDocumentId}
                  onChange={(event) =>
                    setSelectedDocumentId(event.target.value)
                  }
                >
                  <option value="">Select a document</option>

                  {selectableDocuments.map((document) => (
                    <option
                      key={getDocumentId(document)}
                      value={getDocumentId(document)}
                    >
                      {getDocumentName(document)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Portfolio Category</label>

                <input
                  className="input"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="e.g. FINANCIALS, LEGAL, GENERAL"
                />

                <p className="mt-1 text-xs text-muted">
                  This categorizes the document inside the portfolio without
                  creating a duplicate document record.
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleAdd}
              disabled={saving || selectableDocuments.length === 0}
            >
              {saving ? "Adding..." : "Add Document"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
