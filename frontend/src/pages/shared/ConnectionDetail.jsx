import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { connectionAPI, messageAPI } from "../../api/index.js";
import {
  Alert,
  Spinner,
  formatDate,
  formatINR,
  GradeBadge,
} from "../../components/ui/index.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { diligenceAPI } from "../../api/index.js";
import { documentAPI } from "../../api/index.js";
import { Video } from "lucide-react";
import { imageUrl } from "../../utils/image";
const STAGES = [
  "ACCEPTED",
  "INTRO_CALL",
  "MEETING",
  "DUE_DILIGENCE",
  "TERM_SHEET",
  "CLOSED",
  "DROPPED",
];
const STAGE_LABELS = {
  ACCEPTED: "Accepted",
  INTRO_CALL: "Intro Call",
  MEETING: "Meeting",
  DUE_DILIGENCE: "Due Diligence",
  TERM_SHEET: "Term Sheet",
  CLOSED: "Closed",
  DROPPED: "Dropped",
};
const STAGE_COLORS = {
  ACCEPTED: "#677555",
  INTRO_CALL: "#022440",
  MEETING: "#CEAE5E",
  DUE_DILIGENCE: "#B45309",
  TERM_SHEET: "#7C3AED",
  CLOSED: "#059669",
  DROPPED: "#DC2626",
};
const DECISION_COLORS = {
  STRONG_BUY: "#059669",
  INVESTIGATE: "#022440",
  WATCH: "#B45309",
  PASS: "#DC2626",
};

const SUGGESTED_ACTIONS = [
  "Request financial model",
  "Verify revenue figures",
  "Ask about runway",
  "Request cap table",
  "Schedule a call",
  "Ask about team background",
];

export default function ConnectionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conn, setConn] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [error, setError] = useState("");
  const [showSuggested, setShowSuggested] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [closeForm, setCloseForm] = useState({
    outcome: "WON",
    deal_amount: "",
    round_type: "SEED",
    lead_investor_name: "",
    outcome_notes: "",
  });
  const [sharedDocuments, setSharedDocuments] = useState([]);

  const [allDocuments, setAllDocuments] = useState([]);
  const [creatingRequest, setCreatingRequest] = useState(false);

  const [diligenceRequests, setDiligenceRequests] = useState([]);

  const [requestForm, setRequestForm] = useState({
    title: "",

    request_type: "GST_FILINGS",

    notes: "",
  });

  const [respondingId, setRespondingId] = useState(null);

  const [selectedDocs, setSelectedDocs] = useState({});
  const bottomRef = useRef(null);

  const [uploadingFor, setUploadingFor] = useState(null);

  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const [cr, mr] = await Promise.all([
      connectionAPI.getConnection(id),
      messageAPI.getMessages(id),
    ]);
    setConn(cr.data.data);
    setMessages(mr.data.data);

    try {
      const dr = await diligenceAPI.list(cr.data.data.listing?.id);

      setDiligenceRequests(dr.data.data);
      if (user?.role === "CAPITAL_SEEKER") {
        try {
          const allDocs = await documentAPI.list(cr.data.data.listing?.id);

          setAllDocuments(allDocs.data.data || []);

          const shared = await connectionAPI.getSharedDocuments(id);

          setSharedDocuments(shared.data.data.map((d) => d.document));
        } catch (err) {
          console.error(err);
        }
      }
    } catch {}

    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!id) return;

    const seen = localStorage.getItem("dealroom_notice_seen");

    if (!seen) {
      setShowSafetyNotice(true);
    }
  }, [id]);
  // Poll messages every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      messageAPI
        .getMessages(id)
        .then((r) => setMessages(r.data.data))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const send = async (text) => {
    const msg = text || msgText;
    if (!msg.trim()) return;
    setSending(true);
    try {
      const r = await messageAPI.send(id, msg.trim());
      setMessages((prev) => [...prev, r.data.data]);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
      setMsgText("");
      setShowSuggested(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };
  const createDiligenceRequest = async () => {
    try {
      setCreatingRequest(true);

      const r = await diligenceAPI.create({
        startup_id: conn.listing?.id,

        title: requestForm.title,

        request_type: requestForm.request_type,

        notes: requestForm.notes,
      });

      setDiligenceRequests((prev) => [r.data.data, ...prev]);

      setRequestModal(false);

      setRequestForm({
        title: "",

        request_type: "GST_FILINGS",

        notes: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create request");
    } finally {
      setCreatingRequest(false);
    }
  };
  const respondToRequest = async (requestId) => {
    try {
      setRespondingId(requestId);

      await diligenceAPI.respond(
        requestId,

        {
          document_id: selectedDocs[requestId],
        },
      );

      const dr = await diligenceAPI.list(conn.listing?.id);

      setDiligenceRequests(dr.data.data || []);
      const shared = await connectionAPI.getSharedDocuments(id);

      setSharedDocuments(shared.data.data.map((d) => d.document));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to respond");
    } finally {
      setRespondingId(null);
    }
  };

  const uploadNewDocument = async (requestId, file) => {
    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", file);

      formData.append("document_type", "DILIGENCE_REQUEST");

      formData.append("startup_id", conn.listing?.id);

      const uploadRes = await documentAPI.upload(formData);

      const documentId = uploadRes.data.data.id;

      await diligenceAPI.respond(
        requestId,

        {
          document_id: documentId,
        },
      );

      const dr = await diligenceAPI.list(conn.listing?.id);

      setDiligenceRequests(dr.data.data || []);
      const shared = await connectionAPI.getSharedDocuments(id);

      setSharedDocuments(shared.data.data.map((d) => d.document));
      setUploadingFor(null);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  const updateStage = async (stage, extraData = {}) => {
    setUpdatingStage(true);
    setError("");
    try {
      const r = await connectionAPI.updateStage(id, {
        deal_stage: stage,
        ...extraData,
      });
      setConn(r.data.data);
      // Reload messages to show system message
      messageAPI
        .getMessages(id)
        .then((r) => setMessages(r.data.data))
        .catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update stage");
    } finally {
      setUpdatingStage(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  if (!conn) return <Alert type="error" message="Connection not found" />;

  const isSeeker = user?.role === "CAPITAL_SEEKER";
  const other = isSeeker ? conn.investor : conn.seeker;
  const isClosed = conn.status === "CLOSED";
  const ndaPending =
    isSeeker &&
    conn?.nda_required &&
    !conn?.nda_executed &&
    !conn?.nda_requirement_overridden;
  const score = conn.listing?.score;

  return (
    <div className="anim-up">
      <div className="mb-4">
        <Link to="/connections" className="btn-ghost text-sm">
          ← Back to Pipeline
        </Link>
      </div>

      {/* Deal context header */}
      <div className="card mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {other?.profile_image_url ? (
                <img
                  src={imageUrl(other.profile_image_url)}
                  alt={other?.name}
                  className="w-14 h-14 rounded-full object-cover border border-gold/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-goldD font-display font-bold text-lg">
                  {other?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h1 className="font-display text-2xl font-semibold text-navy mb-1">
                {conn.listing?.name}
              </h1>

              <p className="text-muted text-sm">
                {isSeeker ? "Investor" : "Capital Seeker"}:{" "}
                <span className="font-medium text-text">{other?.name}</span>
              </p>

              <div className="flex gap-3 mt-2 flex-wrap text-xs text-dim">
                <span>{conn.listing?.sector}</span>
                <span>{formatINR(conn.listing?.funding_ask)} ask</span>
                <span>Connected {formatDate(conn.created_at)}</span>
              </div>
            </div>
          </div>
          {!isSeeker && (
            <button
              onClick={() => setRequestModal(true)}
              className="
  bg-amber-500
  hover:bg-amber-600
  text-white
  px-4 py-2
  rounded-xl
  text-sm
  font-medium
  transition
"
            >
              Request Document
            </button>
          )}
          {/* Stage badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted">Stage:</span>
            <span
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border"
              style={{
                color: STAGE_COLORS[conn.deal_stage],
                borderColor: STAGE_COLORS[conn.deal_stage],
                background: `${STAGE_COLORS[conn.deal_stage]}12`,
              }}
            >
              {STAGE_LABELS[conn.deal_stage]}
            </span>
          </div>
        </div>

        {/* Stage progression */}
        {!isClosed && (
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-3">
              Move Deal Stage
            </p>
            <div className="flex flex-wrap gap-2">
              {STAGES.filter((s) => s !== conn.deal_stage).map((stage) => (
                <button
                  key={stage}
                  onClick={() => {
                    if (stage === "CLOSED") {
                      setCloseModal(true);
                      return;
                    }

                    updateStage(stage);
                  }}
                  disabled={updatingStage}
                  className="px-3 py-1.5 text-xs font-semibold border transition-all duration-150 hover:opacity-80 disabled:opacity-40"
                  style={{
                    color: STAGE_COLORS[stage],
                    borderColor: STAGE_COLORS[stage],
                    background: `${STAGE_COLORS[stage]}10`,
                  }}
                >
                  {updatingStage ? "…" : `→ ${STAGE_LABELS[stage]}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Alert type="error" message={error} onClose={() => setError("")} />
      <div className="card mb-5">
        <div
          className="
    flex items-center
    justify-between mb-4
  "
        >
          <h2
            className="
      font-display text-lg
      font-semibold text-navy
    "
          >
            Diligence Requests
          </h2>

          <span
            className="
      text-xs text-dim
    "
          >
            {diligenceRequests.length} requests
          </span>
        </div>

        {diligenceRequests.length === 0 ? (
          <p
            className="
          text-sm text-muted
        "
          >
            No diligence requests yet.
          </p>
        ) : (
          <div className="space-y-3">
            {diligenceRequests.map((r) => (
              <div
                key={r.id}
                className="
                border border-border
                rounded-xl p-4
              "
              >
                <div
                  className="
                flex items-center
                justify-between mb-2
              "
                >
                  <div>
                    <p
                      className="
                    font-semibold text-sm
                  "
                    >
                      {r.title}
                    </p>

                    <p
                      className="
                    text-xs text-dim
                  "
                    >
                      {r.request_type}
                    </p>
                  </div>

                  <span
                    className="
                  badge-amber
                "
                  >
                    {r.status}
                  </span>
                </div>

                {r.notes && (
                  <p
                    className="
                  text-sm text-muted
                "
                  >
                    {r.notes}
                  </p>
                )}

                {r.response_document && (
                  <div
                    className="
      mt-4 p-3 rounded-xl
      border border-green-200
      bg-green-50
    "
                  >
                    <div
                      className="
        flex items-center
        justify-between
        gap-3 flex-wrap
      "
                    >
                      <div>
                        <p
                          className="
            text-sm font-semibold
            text-green-800
          "
                        >
                          Attached Document
                        </p>

                        <p
                          className="
            text-sm text-green-700
          "
                        >
                          {r.response_document.file_name}
                        </p>
                      </div>

                      <div
                        className="
          flex items-center gap-2
        "
                      >
                        <span
                          className={`
    text-xs px-2 py-1
    rounded-full
    font-semibold

    ${
      r.response_document?.verification_status === "KUBERLIST_REVIEWED"
        ? "bg-green-100 text-green-700"
        : r.response_document?.verification_status === "THIRD_PARTY_VERIFIED"
          ? "bg-blue-100 text-blue-700"
          : r.response_document?.verification_status === "UPLOADED"
            ? "bg-gray-100 text-gray-700"
            : "bg-amber-100 text-amber-700"
    }
  `}
                        >
                          {r.response_document?.verification_status?.replaceAll(
                            "_",
                            " ",
                          )}
                        </span>

                        <a
                          href={r.response_document.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="
              bg-navy text-white
              px-3 py-1.5 rounded-lg
              text-xs font-medium
            "
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                {isSeeker &&
                  r.status === "REQUESTED" &&
                  (ndaPending ? (
                    <div className="mt-4 border border-amber-200 bg-amber-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-amber-800">
                        This startup requires an NDA before sharing additional
                        documents.
                      </p>

                      <p className="text-xs text-amber-700 mt-2">
                        Upload a signed NDA or proceed without requiring one.
                      </p>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() =>
                            setUploadingFor(
                              uploadingFor === `nda-${r.id}`
                                ? null
                                : `nda-${r.id}`,
                            )
                          }
                          className="btn-navy btn-sm"
                        >
                          Upload Signed NDA
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              await connectionAPI.overrideNDA(conn.id);
                              await load();
                            } catch (err) {
                              setError(
                                err.response?.data?.message ||
                                  "Failed to override NDA",
                              );
                            }
                          }}
                          className="btn-outline btn-sm"
                        >
                          Proceed Without NDA
                        </button>
                      </div>

                      {uploadingFor === `nda-${r.id}` && (
                        <div className="mt-3">
                          <input
                            type="file"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              try {
                                const formData = new FormData();
                                formData.append("file", file);

                                await connectionAPI.uploadNDA(
                                  conn.id,
                                  formData,
                                );

                                await load();
                              } catch (err) {
                                setError(
                                  err.response?.data?.message ||
                                    "Failed to upload NDA",
                                );
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2 items-center flex-wrap">
                      {/* KEEP ALL YOUR EXISTING CODE HERE */}

                      <select
                        value={selectedDocs[r.id] || ""}
                        onChange={(e) =>
                          setSelectedDocs({
                            ...selectedDocs,
                            [r.id]: e.target.value,
                          })
                        }
                        className="input max-w-xs"
                      >
                        <option value="">Select document</option>

                        {allDocuments
                          .filter(
                            (doc) =>
                              !sharedDocuments.some((s) => s.id === doc.id),
                          )
                          .map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.file_name}
                            </option>
                          ))}
                      </select>

                      <button
                        disabled={!selectedDocs[r.id] || respondingId === r.id}
                        onClick={() => respondToRequest(r.id)}
                        className="
          bg-amber-500
          hover:bg-amber-600
          text-white
          px-4 py-2
          rounded-xl
          text-sm
          font-medium
        "
                      >
                        {respondingId === r.id
                          ? "Sending..."
                          : "Attach Document"}
                      </button>

                      <button
                        onClick={() =>
                          setUploadingFor(uploadingFor === r.id ? null : r.id)
                        }
                        className="
          border border-amber-300
          text-amber-700
          px-4 py-2
          rounded-xl
          text-sm
          font-medium
        "
                      >
                        Upload New
                      </button>

                      {uploadingFor === r.id && (
                        <div className="mt-3">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];

                              if (file) {
                                uploadNewDocument(r.id, file);
                              }
                            }}
                            className="text-sm"
                          />

                          {uploading && (
                            <p className="text-xs text-muted mt-2">
                              Uploading...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-navy">
            Documents Shared With This Investor
          </h2>

          <span className="text-xs text-dim">
            {sharedDocuments.length} documents
          </span>
        </div>

        {sharedDocuments.length === 0 ? (
          <p className="text-sm text-muted">
            No documents have been shared with this investor yet.
          </p>
        ) : (
          <div className="space-y-3">
            {sharedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="border border-border rounded-xl p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-sm">{doc.file_name}</p>

                  <p className="text-xs text-dim">{doc.document_type}</p>
                </div>

                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline btn-sm"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Messaging */}
      {/* Messaging */}
      <div className="card flex flex-col" style={{ height: "520px" }}>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border flex-shrink-0">
          <h2 className="font-display text-lg font-semibold text-navy">
            Messages
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVideoModal(true)}
              title="Video Calling (Coming Soon)"
              className="w-9 h-9 rounded-full border border-border hover:border-gold hover:bg-gold/10 transition flex items-center justify-center"
            >
              <Video size={18} className="text-navy" />
            </button>

            <span className="text-xs text-dim">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-4xl mb-3 opacity-20">💬</p>
              <p className="text-muted text-sm">
                No messages yet. Start the conversation.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === user.id;
              const isSystem = m.is_system;

              if (isSystem) {
                return (
                  <div key={m.id} className="flex justify-center">
                    <span className="text-xs text-dim bg-bg border border-border px-3 py-1">
                      {m.message}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                  >
                    {!isMe && (
                      <span className="text-xs text-dim px-1">
                        {m.sender?.name}
                      </span>
                    )}
                    <div
                      className={`px-4 py-2.5 text-sm leading-relaxed ${isMe ? "bg-navy text-white" : "bg-bg border border-border text-text"}`}
                    >
                      {m.message}
                    </div>
                    <span className="text-xs text-dim px-1">
                      {new Date(m.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {formatDate(m.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        {!isClosed ? (
          <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
            {/* Suggested actions */}
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowSuggested((v) => !v)}
                className="text-xs text-muted hover:text-navy transition-colors"
              >
                💡 Suggested actions {showSuggested ? "▲" : "▼"}
              </button>
              {showSuggested &&
                SUGGESTED_ACTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => send(a)}
                    className="text-xs bg-navy/8 text-navy border border-navy/15 px-2.5 py-1 hover:bg-navy/15 transition-colors"
                  >
                    {a}
                  </button>
                ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                className="input flex-1"
                placeholder="Type a message…"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !msgText.trim()}
                className="btn-navy btn-sm px-5 disabled:opacity-40"
              >
                {sending ? <Spinner size="sm" /> : "Send →"}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-border text-center text-sm text-muted flex-shrink-0">
            This connection is closed. No further messages can be sent.
          </div>
        )}
      </div>
      {showSafetyNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-navy mb-4">
              ⚠ Important Safety Notice
            </h2>

            <div className="space-y-3 text-sm text-muted">
              <p>
                KuberList is a discovery platform and does not act as an
                investment advisor, broker, intermediary, or funding
                facilitator.
              </p>

              <p>
                KuberList does not ask, encourage, facilitate, or require
                startups to make any payment to investors in exchange for
                funding. Never transfer money to any user in exchange for
                funding commitments.
              </p>

              <p>
                Conduct your own due diligence before sharing confidential
                information or entering into any transaction.
              </p>

              <p>
                If any user requests payment in exchange for funding, please
                report them immediately. By continuing, you acknowledge that
                KuberList is only a discovery platform and that all investment
                decisions and transactions are conducted at your own discretion
                and risk.
              </p>
            </div>

            <button
              className="btn-navy w-full mt-5"
              onClick={() => {
                localStorage.setItem("dealroom_notice_seen", "true");
                setShowSafetyNotice(false);
              }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}
      {closeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-navy">Close Deal</h2>

              <button
                onClick={() => setCloseModal(false)}
                className="text-xl text-dim"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-semibold text-amber-800 mb-2">
                  ⚠ Funding Confirmation Reminder
                </p>

                <p className="text-amber-700">
                  KuberList does not participate in, verify, guarantee, or
                  facilitate investment transactions.
                </p>

                <ul className="mt-2 list-disc pl-5 text-amber-700">
                  <li>Confirm funds have actually been received.</li>
                  <li>Confirm legal documentation is executed.</li>
                  <li>
                    Confirm you have independently verified the counterparty.
                  </li>
                </ul>

                <p className="mt-2 text-amber-700">
                  KuberList is not responsible for transactions conducted
                  outside the platform.
                </p>
              </div>
              <select
                value={closeForm.outcome}
                onChange={(e) =>
                  setCloseForm({
                    ...closeForm,
                    outcome: e.target.value,
                  })
                }
                className="select"
              >
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>

              {closeForm.outcome === "WON" && (
                <>
                  <input
                    type="number"
                    placeholder="Amount Raised"
                    value={closeForm.deal_amount}
                    onChange={(e) =>
                      setCloseForm({
                        ...closeForm,
                        deal_amount: e.target.value,
                      })
                    }
                    className="input"
                  />

                  <input
                    type="text"
                    placeholder="Round Type"
                    value={closeForm.round_type}
                    onChange={(e) =>
                      setCloseForm({
                        ...closeForm,
                        round_type: e.target.value,
                      })
                    }
                    className="input"
                  />

                  <input
                    type="text"
                    placeholder="Lead Investor"
                    value={closeForm.lead_investor_name}
                    onChange={(e) =>
                      setCloseForm({
                        ...closeForm,
                        lead_investor_name: e.target.value,
                      })
                    }
                    className="input"
                  />
                </>
              )}

              <textarea
                rows={4}
                placeholder="Notes"
                value={closeForm.outcome_notes}
                onChange={(e) =>
                  setCloseForm({
                    ...closeForm,
                    outcome_notes: e.target.value,
                  })
                }
                className="input"
              />

              <button
                className="btn-navy w-full"
                disabled={updatingStage}
                onClick={async () => {
                  await updateStage("CLOSED", closeForm);

                  setCloseModal(false);
                }}
              >
                {updatingStage ? "Closing..." : "Close Deal"}
              </button>
            </div>
          </div>
        </div>
      )}
      {requestModal && (
        <div
          className="
      fixed inset-0 z-50
      flex items-center
      justify-center
      bg-black/40
      p-4
    "
        >
          <div
            className="
        bg-white w-full
        max-w-md rounded-2xl
        p-6
      "
          >
            <div
              className="
          flex items-center
          justify-between mb-5
        "
            >
              <h2
                className="
            text-lg font-semibold
            text-navy
          "
              >
                Request Document
              </h2>

              <button
                onClick={() => setRequestModal(false)}
                className="
              text-xl text-dim
            "
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="
              Request title
            "
                value={requestForm.title}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,

                    title: e.target.value,
                  })
                }
                className="input"
              />

              <select
                value={requestForm.request_type}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,

                    request_type: e.target.value,
                  })
                }
                className="select"
              >
                <option value="GST_FILINGS">GST Filings</option>

                <option value="BANK_STATEMENTS">Bank Statements</option>

                <option value="CAP_TABLE">Cap Table</option>

                <option value="CUSTOMER_CONTRACTS">Customer Contracts</option>

                <option value="FINANCIAL_STATEMENTS">
                  Financial Statements
                </option>

                <option value="OTHER">Other</option>
              </select>

              <textarea
                rows={4}
                placeholder="
              Additional notes...
            "
                value={requestForm.notes}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,

                    notes: e.target.value,
                  })
                }
                className="input"
              />

              <button
                onClick={createDiligenceRequest}
                disabled={creatingRequest}
                className="
              btn-navy w-full
            "
              >
                {creatingRequest ? "Creating..." : "Create Request"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-navy">Video Calling</h2>

              <button
                onClick={() => setShowVideoModal(false)}
                className="text-xl text-dim"
              >
                ×
              </button>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">📹</div>

              <p className="font-semibold text-navy mb-3">Coming Soon</p>

              <p className="text-sm text-muted leading-6">
                Secure in-platform video meetings are currently under
                development.
              </p>

              <p className="text-sm text-muted mt-3">
                Until then, continue your discussion through chat or use your
                preferred video conferencing platform.
              </p>

              <button
                onClick={() => setShowVideoModal(false)}
                className="btn-navy w-full mt-6"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
