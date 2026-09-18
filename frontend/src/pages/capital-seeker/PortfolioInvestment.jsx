import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  documentAPI,
  portfolioAPI,
} from "../../api/index.js";

import {
  Alert,
  PageHeader,
  Spinner,
} from "../../components/ui/index.jsx";

import InvestmentOverview from "../../components/portfolio/InvestmentOverview.jsx";
import InvestmentMilestones from "../../components/portfolio/InvestmentMilestones.jsx";
import InvestmentDocuments from "../../components/portfolio/InvestmentDocuments.jsx";
import InvestmentUpdates from "../../components/portfolio/InvestmentUpdates.jsx";
import InvestmentChat from "../../components/portfolio/InvestmentChat.jsx";

import { useAuth } from "../../hooks/useAuth.jsx";

export default function PortfolioInvestment() {
  const { investmentId: id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspace = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const response = await portfolioAPI.getWorkspace(id);

      setWorkspace(response.data.data || null);
    } catch (requestError) {
      setWorkspace(null);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to load portfolio workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    const listingId = workspace?.investment?.listing?.id;

    if (!listingId) {
      setAvailableDocuments([]);
      return;
    }

    let cancelled = false;

    const loadDocuments = async () => {
      try {
        const response = await documentAPI.list(listingId);

        if (!cancelled) {
          setAvailableDocuments(response.data.data || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setAvailableDocuments([]);
          console.error(
            "[Portfolio Workspace] Failed to load available documents:",
            requestError,
          );
        }
      }
    };

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [workspace?.investment?.listing?.id]);

  const createMilestone = async (payload) => {
    const response = await portfolioAPI.createMilestone(id, payload);

    setWorkspace((current) =>
      current
        ? {
            ...current,
            milestones: [
              ...(current.milestones || []),
              response.data.data,
            ],
          }
        : current,
    );

    return response;
  };

  const updateMilestone = async (milestoneId, payload) => {
    const response = await portfolioAPI.updateMilestone(
      id,
      milestoneId,
      payload,
    );

    setWorkspace((current) =>
      current
        ? {
            ...current,
            milestones: (current.milestones || []).map((milestone) =>
              milestone.id === milestoneId
                ? response.data.data
                : milestone,
            ),
          }
        : current,
    );

    return response;
  };

  const deleteMilestone = async (milestoneId) => {
    await portfolioAPI.removeMilestone(id, milestoneId);

    setWorkspace((current) =>
      current
        ? {
            ...current,
            milestones: (current.milestones || []).filter(
              (milestone) => milestone.id !== milestoneId,
            ),
          }
        : current,
    );
  };

  const addDocument = async (payload) => {
    const response = await portfolioAPI.addDocument(id, payload);

    setWorkspace((current) =>
      current
        ? {
            ...current,
            documents: [
              response.data.data,
              ...(current.documents || []),
            ],
          }
        : current,
    );

    return response;
  };

  const removeDocument = async (documentId) => {
    await portfolioAPI.removeDocument(id, documentId);

    setWorkspace((current) =>
      current
        ? {
            ...current,
            documents: (current.documents || []).filter(
              (item) =>
                item.document?.id !== documentId,
            ),
          }
        : current,
    );
  };

  const sendMessage = async (message) => {
    const response = await portfolioAPI.sendMessage(id, message);

    setWorkspace((current) =>
      current
        ? {
            ...current,
            messages: [
              ...(current.messages || []),
              response.data.data,
            ],
          }
        : current,
    );

    return response;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="anim-up">
        <PageHeader
          title="Portfolio Investment"
          subtitle="Investment workspace"
          actions={
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => navigate("/seeker/portfolio")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Portfolio
            </button>
          }
        />

        <Alert
          type="error"
          message={error || "Investment workspace not found."}
        />

        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={loadWorkspace}
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  const investment = workspace.investment;
  const access = workspace.access || {};

  const companyName =
    investment?.listing?.name ||
    investment?.external_organization?.name ||
    "Portfolio Investment";

  return (
    <div className="anim-up space-y-6">
      <PageHeader
        title={companyName}
        subtitle="Post-investment portfolio workspace"
        actions={
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => navigate("/seeker/portfolio")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Portfolio
          </button>
        }
      />

      <InvestmentOverview
        investment={investment}
        access={access}
      />

      <InvestmentMilestones
        investmentId={id}
        milestones={workspace.milestones || []}
        canManage={Boolean(access.can_manage_investment)}
        onCreate={createMilestone}
        onUpdate={updateMilestone}
        onDelete={deleteMilestone}
      />

      <InvestmentDocuments
        documents={workspace.documents || []}
        availableDocuments={availableDocuments}
        canManage={Boolean(access.can_manage_investment)}
        onAdd={addDocument}
        onRemove={removeDocument}
      />

      <InvestmentUpdates
        updates={workspace.updates || []}
      />

      <InvestmentChat
        messages={workspace.messages || []}
        currentUserId={user?.id}
        canChat={Boolean(access.can_chat)}
        onSend={sendMessage}
      />


    </div>
  );
}




