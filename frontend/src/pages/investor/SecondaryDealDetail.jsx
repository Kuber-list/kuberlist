import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { secondaryDealAPI } from "../../api/index.js";

import {
  PageHeader,
  Alert,
  Spinner,
  formatINR,
  formatDate,
} from "../../components/ui/index.jsx";

export default function SecondaryDealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deal, setDeal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const [documents, setDocuments] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const [requestTitle, setRequestTitle] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [requestingDocument, setRequestingDocument] = useState(false);

  const [fulfillingRequestId, setFulfillingRequestId] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const loadDeal = useCallback(() => {
    setLoading(true);
    setError("");

    Promise.all([
      secondaryDealAPI.getById(id),
      secondaryDealAPI.getMessages(id),
      secondaryDealAPI.getDocuments(id),
      secondaryDealAPI.getDocumentRequests(id),
    ])
      .then(
        ([
          dealResponse,
          messagesResponse,
          documentsResponse,
          requestsResponse,
        ]) => {
          setDeal(dealResponse.data.data || null);

          setCurrentUserId(dealResponse.data.current_user_id || "");

          setMessages(messagesResponse.data.data || []);
          setDocuments(documentsResponse.data.data || []);
          setDocumentRequests(requestsResponse.data.data || []);
        },
      )
      .catch((err) => {
        setError(
          err.response?.data?.message || "Failed to load secondary deal",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || sending) return;

    try {
      setSending(true);

      const response = await secondaryDealAPI.sendMessage(id, message.trim());

      setMessages((current) => [...current, response.data.data]);

      setMessage("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const requestDocument = async (e) => {
    e.preventDefault();

    if (!requestTitle.trim() || requestingDocument) return;

    try {
      setRequestingDocument(true);
      setError("");

      const response = await secondaryDealAPI.requestDocument(id, {
        title: requestTitle.trim(),
        description: requestDescription.trim(),
      });

      setDocumentRequests((current) => [response.data.data, ...current]);

      setRequestTitle("");
      setRequestDescription("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request document");
    } finally {
      setRequestingDocument(false);
    }
  };

  const updateStatus = async (status) => {
    if (updatingStatus || deal.status === status) return;

    try {
      setUpdatingStatus(true);
      setError("");

      const response = await secondaryDealAPI.updateStatus(id, status);

      setDeal((current) => ({
        ...current,
        ...response.data.data,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update deal status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const stages = ["IN_DISCUSSION", "NEGOTIATING", "AGREED", "COMPLETED"];

  const uploadDocument = async (e) => {
    e.preventDefault();

    if (!selectedFile || uploadingDocument) return;

    try {
      setUploadingDocument(true);
      setError("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await secondaryDealAPI.uploadDocument(id, formData);

      setDocuments((current) => [...current, response.data.data]);

      setSelectedFile(null);

      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDocument(false);
    }
  };

  const fulfillDocumentRequest = async (requestId, file) => {
    if (!file || fulfillingRequestId) return;

    try {
      setFulfillingRequestId(requestId);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await secondaryDealAPI.fulfillDocumentRequest(
        id,
        requestId,
        formData,
      );

      setDocumentRequests((current) =>
        current.map((request) =>
          request.id === requestId ? response.data.data : request,
        ),
      );

      if (response.data.document) {
        setDocuments((current) => [response.data.document, ...current]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fulfill document request",
      );
    } finally {
      setFulfillingRequestId("");
    }
  };

  const formatStatus = (status) => status?.replace(/_/g, " ");
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="anim-up">
        <Alert
          type="error"
          message={error || "Secondary deal not found"}
          onClose={() => setError("")}
        />

        <button
          type="button"
          className="btn-outline"
          onClick={() => navigate("/investor/secondary-deals")}
        >
          Back to Secondary Deals
        </button>
      </div>
    );
  }

  const opportunity = deal.secondary_interest?.opportunity;

  const companyName =
    opportunity?.listing?.name ||
    opportunity?.external_organization?.name ||
    "Unknown Organization";

  const isSeller = deal.seller?.id === currentUserId;

  const otherParty = isSeller ? deal.buyer : deal.seller;

  return (
    <div className="anim-up">
      <div className="mb-6">
        <button
          type="button"
          className="text-sm text-muted hover:text-navy"
          onClick={() => navigate("/investor/secondary-deals")}
        >
          ← Back to Secondary Deals
        </button>
      </div>

      <PageHeader
        title={companyName}
        subtitle={`Secondary Deal with ${otherParty?.name || "Unknown User"}`}
      />

      <Alert type="error" message={error} onClose={() => setError("")} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* LEFT: Deal information */}
        <div className="xl:col-span-1 space-y-5">
          {/* Deal Stage */}
          <div className="card">
            <h3 className="font-display text-base font-semibold text-navy mb-5">
              Deal Stage
            </h3>

            <div className="flex items-center w-full overflow-x-auto pb-2">
              {stages.map((stage, index) => {
                const currentIndex = stages.indexOf(deal.status);

                const isCurrent = deal.status === stage;

                const isCompleted = currentIndex !== -1 && index < currentIndex;

                const isFuture = !isCurrent && !isCompleted;

                return (
                  <div
                    key={stage}
                    className="flex items-center flex-1 min-w-[130px]"
                  >
                    <button
                      type="button"
                      disabled={
                        updatingStatus ||
                        isCurrent ||
                        deal.status === "FAILED" ||
                        deal.status === "WITHDRAWN" ||
                        deal.status === "COMPLETED"
                      }
                      onClick={() => updateStatus(stage)}
                      className={`w-full flex flex-col items-center gap-2 transition ${
                        isCurrent
                          ? "text-navy"
                          : isCompleted
                            ? "text-navy"
                            : isFuture
                              ? "text-muted hover:text-navy"
                              : "text-muted"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                          isCurrent
                            ? "bg-navy text-white"
                            : isCompleted
                              ? "bg-olive text-white"
                              : "bg-surface text-muted"
                        }`}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>

                      <span className="text-xs font-medium text-center whitespace-nowrap">
                        {formatStatus(stage)}
                      </span>

                      {isCurrent && (
                        <span className="text-[10px] text-muted">Current</span>
                      )}
                    </button>

                    {index < stages.length - 1 && (
                      <div
                        className={`h-[2px] flex-1 min-w-4 mx-2 mb-8 ${
                          isCompleted ? "bg-olive" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted mb-3">End Deal</p>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline btn-sm flex-1"
                  disabled={
                    updatingStatus ||
                    deal.status === "COMPLETED" ||
                    deal.status === "FAILED" ||
                    deal.status === "WITHDRAWN"
                  }
                  onClick={() => updateStatus("FAILED")}
                >
                  Failed
                </button>

                <button
                  type="button"
                  className="btn-outline btn-sm flex-1"
                  disabled={
                    updatingStatus ||
                    deal.status === "COMPLETED" ||
                    deal.status === "FAILED" ||
                    deal.status === "WITHDRAWN"
                  }
                  onClick={() => updateStatus("WITHDRAWN")}
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="font-display text-base font-semibold text-navy mb-4">
              Deal Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted">Status</span>

                <span className="font-medium text-navy">
                  {deal.status?.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted">
                  {isSeller ? "Buyer" : "Seller"}
                </span>

                <span className="font-medium text-navy">
                  {otherParty?.name || "Unknown User"}
                </span>
              </div>

              {opportunity?.asking_price && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Deal Value</span>

                  <span className="font-medium text-navy">
                    {opportunity.price_visibility === "ON_REQUEST"
                      ? "On Request"
                      : formatINR(opportunity.asking_price)}
                  </span>
                </div>
              )}

              {opportunity?.ownership_percentage && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Ownership Available</span>

                  <span className="font-medium text-navy">
                    {opportunity.ownership_percentage}%
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-4">
                <span className="text-muted">Created</span>

                <span className="font-medium text-navy">
                  {formatDate(deal.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-base font-semibold text-navy mb-3">
              Counterparty
            </h3>

            <p className="font-medium text-navy">
              {otherParty?.name || "Unknown User"}
            </p>

            {otherParty?.email && (
              <p className="text-sm text-muted mt-1">{otherParty.email}</p>
            )}

            <p className="text-xs text-dim mt-3">
              {isSeller ? "Buyer" : "Seller"}
            </p>
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div className="xl:col-span-2">
          <div className="card flex flex-col min-h-[600px]">
            <div className="pb-4 border-b border-border">
              <h3 className="font-display text-base font-semibold text-navy">
                Deal Conversation
              </h3>

              <p className="text-xs text-muted mt-1">
                Communicate directly regarding this secondary transaction.
              </p>
            </div>

            <div className="flex-1 py-5 space-y-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted">
                    No messages yet. Start the conversation.
                  </p>
                </div>
              ) : (
                messages.map((item) => {
                  const isMine = item.sender_id === currentUserId;

                  return (
                    <div
                      key={item.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-4 py-3 ${
                          isMine ? "bg-navy text-white" : "bg-surface text-navy"
                        }`}
                      >
                        {!isMine && (
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {item.sender?.name || "User"}
                          </p>
                        )}

                        <p className="text-sm whitespace-pre-wrap">
                          {item.message}
                        </p>

                        <p className="text-[10px] mt-2 opacity-60">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={sendMessage}
              className="pt-4 border-t border-border flex gap-3"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="input flex-1"
              />

              <button
                type="submit"
                className="btn-primary"
                disabled={!message.trim() || sending}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
      {/* Documents */}
      <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Shared Documents */}
        <div className="card">
          <h3 className="font-display text-base font-semibold text-navy mb-1">
            Shared Documents
          </h3>

          <p className="text-xs text-muted mb-5">
            Documents shared for this secondary transaction.
          </p>

          <form onSubmit={uploadDocument} className="flex gap-3 mb-5">
            <input
              type="file"
              className="input flex-1"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />

            <button
              type="submit"
              className="btn-primary shrink-0"
              disabled={!selectedFile || uploadingDocument}
            >
              {uploadingDocument ? "Uploading..." : "Upload"}
            </button>
          </form>

          {documents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted">
                No documents have been shared yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between gap-3 border border-border rounded-lg px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy truncate">
                      {document.file_name ||
                        document.original_file_name ||
                        "Document"}
                    </p>

                    <p className="text-xs text-muted mt-1">
                      Shared{" "}
                      {document.created_at
                        ? formatDate(document.created_at)
                        : ""}
                    </p>
                  </div>

                  {document.file_url && (
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline btn-sm shrink-0"
                    >
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Requests */}
        <div className="card">
          <h3 className="font-display text-base font-semibold text-navy mb-1">
            Document Requests
          </h3>

          <p className="text-xs text-muted mb-5">
            Request documents from the other party or fulfil their requests.
          </p>

          <form onSubmit={requestDocument} className="space-y-3 mb-6">
            <input
              type="text"
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              placeholder="Document name or request"
              className="input w-full"
            />

            <textarea
              value={requestDescription}
              onChange={(e) => setRequestDescription(e.target.value)}
              placeholder="Add details (optional)"
              className="input w-full min-h-[90px]"
            />

            <button
              type="submit"
              className="btn-outline btn-sm"
              disabled={!requestTitle.trim() || requestingDocument}
            >
              {requestingDocument ? "Requesting..." : "Request Document"}
            </button>
          </form>

          {documentRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted">No document requests yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documentRequests.map((request) => {
                const isRequestedByMe =
                  String(request.requested_by) === String(currentUserId);

                const isRequestedFromMe =
                  String(request.requested_from) === String(currentUserId);

                const isPending = request.status === "REQUESTED";

                return (
                  <div
                    key={request.id}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-navy">
                          {request.title}
                        </p>

                        {request.description && (
                          <p className="text-xs text-muted mt-1">
                            {request.description}
                          </p>
                        )}

                        <p className="text-xs text-dim mt-2">
                          {isRequestedByMe
                            ? "Requested by you"
                            : "Requested from you"}
                        </p>
                      </div>

                      <span className="badge-olive shrink-0">
                        {request.status
                          ? request.status.replace(/_/g, " ")
                          : "PENDING"}
                      </span>
                    </div>

                    {isRequestedFromMe && isPending && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <label className="block text-xs text-muted mb-2">
                          Upload requested document
                        </label>

                        <input
                          type="file"
                          className="input w-full text-sm"
                          disabled={fulfillingRequestId === request.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (file) {
                              fulfillDocumentRequest(request.id, file);

                              e.target.value = "";
                            }
                          }}
                        />

                        {fulfillingRequestId === request.id && (
                          <p className="text-xs text-muted mt-2">
                            Uploading document...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
