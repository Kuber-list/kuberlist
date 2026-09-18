import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
} from "lucide-react";

import {
  Alert,
  EmptyState,
  Spinner,
} from "../ui/index.jsx";

function formatMessageTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InvestmentChat({
  messages = [],
  currentUserId,
  canChat = true,
  loading = false,
  onSend,
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending || !canChat) {
      return;
    }

    if (trimmedMessage.length > 5000) {
      setError("Message cannot exceed 5000 characters.");
      return;
    }

    try {
      setSending(true);
      setError("");

      await onSend?.(trimmedMessage);
      setMessage("");
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Failed to send message.",
      );
    } finally {
      setSending(false);
    }
  };

  if (!canChat) {
    return (
      <section className="rounded-xl border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
              <MessageCircle className="h-5 w-5 text-navy" />
            </div>

            <div>
              <h3 className="font-display text-xl font-semibold text-navy">
                Portfolio Chat
              </h3>

              <p className="mt-1 text-sm text-muted">
                Post-investment communication between the investor and company.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6">
          <EmptyState
            icon="💬"
            title="Portfolio chat unavailable"
            description="Portfolio chat is available for KuberList investments with a connected company account."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
            <MessageCircle className="h-5 w-5 text-navy" />
          </div>

          <div>
            <h3 className="font-display text-xl font-semibold text-navy">
              Portfolio Chat
            </h3>

            <p className="mt-1 text-sm text-muted">
              Post-investment communication between the investor and company.
            </p>
          </div>
        </div>
      </div>

      <div className="h-[420px] overflow-y-auto bg-gray-50/50 px-4 py-5 sm:px-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon="💬"
              title="No messages yet"
              description="Start the post-investment conversation."
            />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((item) => {
              const isMine =
                currentUserId &&
                item.sender_id === currentUserId;

              return (
                <div
                  key={item.id}
                  className={`flex ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? "bg-navy text-white"
                        : "border border-border bg-white text-navy"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span
                        className={
                          isMine
                            ? "font-medium text-white"
                            : "font-medium text-navy"
                        }
                      >
                        {isMine
                          ? "You"
                          : item.sender?.name || "Participant"}
                      </span>

                      <span
                        className={
                          isMine
                            ? "text-white/60"
                            : "text-muted"
                        }
                      >
                        {formatMessageTime(item.created_at)}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 sm:p-5">
        {error && <Alert type="error" message={error} />}

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-3"
        >
          <textarea
            className="input min-h-[48px] flex-1 resize-none"
            value={message}
            maxLength={5000}
            onChange={(event) => {
              setMessage(event.target.value);
              if (error) setError("");
            }}
            placeholder="Write a portfolio message..."
            disabled={sending}
            rows={2}
          />

          <button
            type="submit"
            className="btn-primary inline-flex h-12 shrink-0 items-center gap-2"
            disabled={sending || !message.trim()}
          >
            {sending ? (
              <Spinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}

            <span className="hidden sm:inline">
              {sending ? "Sending..." : "Send"}
            </span>
          </button>
        </form>

        <div className="mt-2 text-right text-xs text-muted">
          {message.length}/5000
        </div>
      </div>
    </section>
  );
}
