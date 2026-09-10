import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import {
  connectionAPI,
  dueDiligenceAPI,
  diligenceAPI,
  documentAPI,
} from "../../api/index.js";
import DueDiligenceChecklist from "./DueDiligenceChecklist.jsx";
import DueDiligenceDocuments from "./DueDiligenceDocuments.jsx";
import DueDiligenceRequests from "./DueDiligenceRequests.jsx";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  ShieldCheck,
  AlertCircle,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
} from "lucide-react";

//import { connectionAPI, dueDiligenceAPI } from "../../api/index.js";

const CATEGORY_ORDER = [
  "LEGAL",
  "BUSINESS",
  "OWNERSHIP",
  "FINANCIAL",
  "CORPORATE",
  "TAX",
  "COMMERCIAL",
  "OTHER",
];

const CATEGORY_LABELS = {
  LEGAL: "Legal",
  BUSINESS: "Business",
  OWNERSHIP: "Ownership",
  FINANCIAL: "Financial",
  CORPORATE: "Corporate",
  TAX: "Tax",
  COMMERCIAL: "Commercial",
  OTHER: "Other",
};

const CATEGORY_ICONS = {
  LEGAL: FileText,
  BUSINESS: BriefcaseBusiness,
  OWNERSHIP: ShieldCheck,
  FINANCIAL: Building2,
  CORPORATE: Building2,
  TAX: FileCheck2,
  COMMERCIAL: BriefcaseBusiness,
  OTHER: FileText,
};

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ScoreRing({ score, type }) {
  const safeScore = Math.min(Math.max(Number(score) || 0, 0), 100);

  const progressColor = type === "verification" ? "#CEAE5E" : "#677555";

  const labelColor = type === "verification" ? "text-goldD" : "text-oliveD";

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex h-32 w-32 items-center justify-center rounded-full p-[9px]"
        style={{
          background: `conic-gradient(
            ${progressColor} ${safeScore * 3.6}deg,
            #E8EBE6 ${safeScore * 3.6}deg
          )`,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
          <span className="font-display text-3xl font-semibold text-navy">
            {safeScore}
          </span>

          <span className="text-xs text-muted">/ 100</span>
        </div>
      </div>

      <span
        className={`mt-3 text-xs font-semibold uppercase tracking-wider ${labelColor}`}
      >
        {type === "verification" ? "Verification" : "Readiness"}
      </span>
    </div>
  );
}
function ScoreCard({ title, score, description, addressed, verified, type }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
        <div className="flex justify-center px-4 sm:justify-start">
          <ScoreRing score={score} type={type} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-navy">
              {title}
            </h2>

            {type === "verification" ? (
              <ShieldCheck className="h-5 w-5 text-gold" />
            ) : (
              <Clock3 className="h-5 w-5 text-olive" />
            )}
          </div>

          <p className="mt-3 text-sm leading-6 text-muted">{description}</p>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {addressed !== undefined && (
              <span className="badge badge-gray">{addressed} addressed</span>
            )}

            {verified !== undefined && (
              <span className="badge badge-gold">{verified} verified</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressStat({ label, value, icon: Icon, tone = "navy" }) {
  const toneClasses = {
    navy: "bg-navy/10 text-navy",
    gold: "bg-gold/10 text-goldD",
    olive: "bg-olive/10 text-oliveD",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <span className="text-sm font-medium text-muted">{label}</span>
      </div>

      <div className="mt-4 font-display text-3xl font-semibold text-navy">
        {value}
      </div>
    </div>
  );
}

function CategoryCard({ category, data }) {
  if (!data) return null;

  const Icon = CATEGORY_ICONS[category] || FileText;

  const score = Math.min(Math.max(Number(data.readiness_score) || 0, 0), 100);

  return (
    <div className="card-hover group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
            <Icon className="h-5 w-5 text-goldD" />
          </div>

          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-navy">
              {CATEGORY_LABELS[category]}
            </h3>

            <p className="mt-0.5 text-xs text-dim">
              {data.total_weight} weighted points
            </p>
          </div>
        </div>

        <div className="font-display text-2xl font-semibold text-navy">
          {score}%
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-gold transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted">{data.addressed_weight} addressed</span>

        <span className="font-medium text-goldD">
          Verification {data.verification_score}%
        </span>
      </div>

      <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-goldD transition group-hover:gap-2">
        View Details
        <span aria-hidden="true">→</span>
      </div>
    </div>
  );
}

export default function DueDiligence() {
  const { user } = useAuth();
  const { id: connectionId } = useParams();
  const navigate = useNavigate();

  const [connection, setConnection] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [diligenceRequests, setDiligenceRequests] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState({});
  const [uploadingFor, setUploadingFor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [requestingRequirementId, setRequestingRequirementId] = useState(null);
  useEffect(() => {
    let mounted = true;

    async function loadDueDiligence() {
      try {
        setLoading(true);
        setError("");

        const connectionResponse =
          await connectionAPI.getConnection(connectionId);

        const workspaceResponse =
          await dueDiligenceAPI.getByConnection(connectionId);

        if (!mounted) return;

        const connectionData = connectionResponse.data?.data;
        const workspaceData = workspaceResponse.data?.data;

        if (!connectionData) {
          throw new Error("Connection not found.");
        }

        if (!workspaceData) {
          throw new Error(
            "Due diligence has not been initialized for this connection.",
          );
        }

        setConnection(connectionData);
        setWorkspace(workspaceData);
        try {
          const requestsResponse = await diligenceAPI.list(
            connectionData.listing?.id,
          );

          if (mounted) {
            setDiligenceRequests(requestsResponse.data?.data || []);
          }

          if (user?.role === "CAPITAL_SEEKER") {
            const documentsResponse = await documentAPI.list(
              connectionData.listing?.id,
            );

            if (mounted) {
              setAllDocuments(documentsResponse.data?.data || []);
            }

            const sharedResponse =
              await connectionAPI.getSharedDocuments(connectionId);

            if (mounted) {
              setSharedDocuments(
                (sharedResponse.data?.data || []).map((item) => item.document),
              );
            }
          }
        } catch (requestError) {
          console.error(
            "Unable to load diligence requests/documents:",
            requestError,
          );
        }
        const [summaryResponse, categoriesResponse] = await Promise.all([
          dueDiligenceAPI.getSummary(workspaceData.id),
          dueDiligenceAPI.getCategories(workspaceData.id),
        ]);

        if (!mounted) return;

        setSummary(summaryResponse.data?.data || null);
        setCategories(categoriesResponse.data?.data || null);
      } catch (err) {
        if (!mounted) return;

        console.error(err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load due diligence.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (connectionId) {
      loadDueDiligence();
    }

    return () => {
      mounted = false;
    };
  }, [connectionId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="anim-spin inline-block h-5 w-5 rounded-full border-2 border-border border-t-gold" />
          Loading Due Diligence…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anim-up">
        <button
          type="button"
          onClick={() => navigate(`/connections/${connectionId}`)}
          className="btn-ghost mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Connection
        </button>

        <div className="card border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />

            <div>
              <h2 className="font-display text-lg font-semibold text-red-700">
                Unable to load Due Diligence
              </h2>

              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!connection || !workspace || !summary) {
    return null;
  }

  const company = connection.listing || {};
  const investor = connection.investor || {};
  const seeker = connection.seeker || {};

  const otherParty =
    connection.investor?.id === connection.investor_id ? investor : seeker;

  const companyName = company.name || "Company";
  const sector = company.sector || "—";
  const stage = company.stage ? formatStatus(company.stage) : "—";

  const counterpartName = otherParty?.name || "—";

  const readiness = Number(summary.readiness_score) || 0;
  const verification = Number(summary.verification_score) || 0;

  const addressed = Number(summary.addressed_requirements) || 0;
  const verified = Number(summary.verified_requirements) || 0;
  const missing = Number(summary.missing_requirements) || 0;
  const total = Number(summary.total_requirements) || 0;

  const progress = total > 0 ? Math.round((addressed / total) * 100) : 0;
  const isSeeker = user?.role === "CAPITAL_SEEKER";

  const ndaPending =
    isSeeker &&
    connection?.nda_required &&
    !connection?.nda_executed &&
    !connection?.nda_requirement_overridden;
  async function respondToRequest(requestId) {
    try {
      setRespondingId(requestId);

      await diligenceAPI.respond(requestId, {
        document_id: selectedDocs[requestId],
      });

      const requestsResponse = await diligenceAPI.list(company.id);
      setDiligenceRequests(requestsResponse.data?.data || []);

      const sharedResponse =
        await connectionAPI.getSharedDocuments(connectionId);

      setSharedDocuments(
        (sharedResponse.data?.data || []).map((item) => item.document),
      );
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Unable to respond to the diligence request.",
      );
    } finally {
      setRespondingId(null);
    }
  }

  async function uploadNewDocument(requestId, file) {
    if (!file) return;

    try {
      setUploading(true);
      setUploadingFor(requestId);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", "DILIGENCE_REQUEST");
      formData.append("startup_id", company.id);

      const uploadResponse = await documentAPI.upload(formData);
      const documentId = uploadResponse.data?.data?.id;

      if (!documentId) {
        throw new Error("Document upload did not return a document ID.");
      }

      await diligenceAPI.respond(requestId, {
        document_id: documentId,
      });

      const requestsResponse = await diligenceAPI.list(company.id);
      setDiligenceRequests(requestsResponse.data?.data || []);

      const sharedResponse =
        await connectionAPI.getSharedDocuments(connectionId);

      setSharedDocuments(
        (sharedResponse.data?.data || []).map((item) => item.document),
      );
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Unable to upload and attach the document.",
      );
    } finally {
      setUploadingFor(null);
      setUploading(false);
    }
  }
  async function requestRequirementDocument(requirement) {
    if (!requirement?.id || isSeeker) return;

    try {
      setRequestingRequirementId(requirement.id);

      const response = await diligenceAPI.create({
        startup_id: company.id,
        requirement_id: requirement.id,
        title:
          requirement.checklist_item?.title || "Due Diligence Document Request",
        request_type: "OTHER",
        notes:
          "Please provide the document or evidence required for this due diligence checklist item.",
      });

      setDiligenceRequests((prev) => [
        response.data?.data,
        ...prev.filter((request) => request.id !== response.data?.data?.id),
      ]);
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          err.message ||
          "Unable to request this diligence document.",
      );
    } finally {
      setRequestingRequirementId(null);
    }
  }
  return (
    <div className="anim-up">
      {/* Header */}
      <div className="page-header">
        <button
          type="button"
          onClick={() => navigate(`/connections/${connectionId}`)}
          className="btn-ghost mb-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Connection
        </button>

        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold text-navy">
                {companyName}
              </h1>

              <span className="badge badge-navy">{sector}</span>

              <span className="badge badge-gold">{stage}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <h2 className="font-display text-xl font-semibold text-navy">
                Due Diligence
              </h2>

              <span className="badge badge-amber">
                {formatStatus(summary.status)}
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm text-muted">
              Review the completeness and verification strength of this due
              diligence process.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 xl:min-w-[560px]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-dim">
                Company
              </p>
              <p className="mt-1 font-medium text-text">{companyName}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-dim">
                Counterparty
              </p>
              <p className="mt-1 font-medium text-text">{counterpartName}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-dim">
                Started
              </p>
              <p className="mt-1 font-medium text-text">
                {formatDate(summary.started_at)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-dim">
                Last Updated
              </p>
              <p className="mt-1 font-medium text-text">
                {formatDate(workspace.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <section className="mt-10">
        <div className="border-b border-border">
          <div className="flex gap-7 overflow-x-auto">
            {[
              { key: "overview", label: "Overview" },
              { key: "checklist", label: "Checklist" },
              { key: "documents", label: "Documents" },
              { key: "requests", label: "Requests" },
            ].map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative whitespace-nowrap pb-3 text-sm font-semibold transition-colors ${
                    isActive ? "text-navy" : "text-muted hover:text-navy"
                  }`}
                >
                  {tab.label}

                  {tab.key === "checklist" && (
                    <span className="ml-1.5 text-xs text-dim">({total})</span>
                  )}

                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gold" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Overview */}
      {activeTab === "overview" && (
        <>
          {/* Scores */}
          <section className="mt-6 grid gap-5 lg:grid-cols-2">
            <ScoreCard
              title="Due Diligence Readiness"
              score={readiness}
              addressed={addressed}
              type="readiness"
              description="Measures how much of the DD checklist has been addressed with documents or responses."
            />

            <ScoreCard
              title="Due Diligence Verification"
              score={verification}
              verified={verified}
              type="verification"
              description="Measures how strongly the supplied evidence has been verified by KuberList or accepted third parties."
            />
          </section>

          {/* Progress */}
          <section className="mt-8">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-navy">
                  DD Progress
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Current state of the diligence checklist.
                </p>
              </div>

              <span className="text-sm font-semibold text-goldD">
                {progress}% addressed
              </span>
            </div>

            <div className="mb-5 h-3 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ProgressStat
                label="Total Requirements"
                value={total}
                icon={FileText}
                tone="navy"
              />

              <ProgressStat
                label="Addressed"
                value={addressed}
                icon={Clock3}
                tone="olive"
              />

              <ProgressStat
                label="Verified"
                value={verified}
                icon={CheckCircle2}
                tone="gold"
              />

              <ProgressStat
                label="Missing"
                value={missing}
                icon={AlertCircle}
                tone="red"
              />
            </div>
          </section>

          {/* Category Breakdown */}
          <section className="mt-8">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-navy">
                  Category Breakdown
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Readiness and verification strength across DD categories.
                </p>
              </div>

              <span className="text-xs font-medium uppercase tracking-widest text-dim">
                {CATEGORY_ORDER.length} categories
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {CATEGORY_ORDER.map((category) => (
                <CategoryCard
                  key={category}
                  category={category}
                  data={categories?.[category]}
                />
              ))}
            </div>
          </section>

          {/* Next Steps */}
          <section className="card mt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
                <CalendarDays className="h-5 w-5 text-goldD" />
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold text-navy">
                  Next Steps
                </h2>

                <p className="mt-1 text-sm text-muted">
                  The most useful actions based on the current DD state.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-bg p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-sm font-semibold text-red-600">
                  1
                </div>

                <h3 className="font-display text-lg font-semibold text-navy">
                  Address missing requirements
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {missing} requirements currently need evidence, responses, or
                  another appropriate action.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-bg p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-goldD">
                  2
                </div>

                <h3 className="font-display text-lg font-semibold text-navy">
                  Review available evidence
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {addressed} requirements have currently been addressed. Review
                  their evidence and status.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-bg p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-olive/15 text-sm font-semibold text-oliveD">
                  3
                </div>

                <h3 className="font-display text-lg font-semibold text-navy">
                  Continue verification
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted">
                  {verified} of {total} requirements are currently verified by
                  KuberList or an accepted third party.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Checklist */}
      {activeTab === "checklist" && (
        <section className="mt-6">
          <DueDiligenceChecklist
            requirements={workspace.requirements}
            loading={false}
            isSeeker={isSeeker}
            onRequestDocument={requestRequirementDocument}
            requestingRequirementId={requestingRequirementId}
          />
        </section>
      )}

      {/* Documents */}
      {activeTab === "documents" && (
        <section className="mt-6">
          <DueDiligenceDocuments
            requirements={workspace.requirements}
            loading={false}
          />
        </section>
      )}

      {/* Requests */}
      {activeTab === "requests" && (
        <section className="mt-6">
          <DueDiligenceRequests
            requests={diligenceRequests}
            isSeeker={user?.role === "CAPITAL_SEEKER"}
            ndaPending={ndaPending}
            allDocuments={allDocuments}
            sharedDocuments={sharedDocuments}
            selectedDocs={selectedDocs}
            setSelectedDocs={setSelectedDocs}
            respondingId={respondingId}
            respondToRequest={respondToRequest}
            uploadingFor={uploadingFor}
            setUploadingFor={setUploadingFor}
            uploadNewDocument={uploadNewDocument}
            uploading={uploading}
          />
        </section>
      )}
    </div>
  );
}
