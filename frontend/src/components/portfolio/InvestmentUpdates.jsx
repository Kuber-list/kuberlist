import {
  CalendarDays,
  Megaphone,
  MessageSquareText,
} from "lucide-react";

import { EmptyState } from "../ui/index.jsx";

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

function getUpdateTitle(update) {
  return (
    update?.title ||
    update?.headline ||
    update?.subject ||
    "Company Update"
  );
}

function getUpdateBody(update) {
  return (
    update?.content ||
    update?.body ||
    update?.message ||
    update?.description ||
    ""
  );
}

export default function InvestmentUpdates({ updates = [] }) {
  const orderedUpdates = [...updates].sort((a, b) => {
    const aDate = new Date(
      a.created_at || a.updated_at || 0,
    ).getTime();

    const bDate = new Date(
      b.created_at || b.updated_at || 0,
    ).getTime();

    return bDate - aDate;
  });

  return (
    <section className="rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
            <Megaphone className="h-5 w-5 text-navy" />
          </div>

          <div>
            <h3 className="font-display text-xl font-semibold text-navy">
              Company Updates
            </h3>

            <p className="mt-1 text-sm text-muted">
              Updates shared by the company and surfaced here for portfolio
              monitoring.
            </p>
          </div>
        </div>
      </div>

      {orderedUpdates.length === 0 ? (
        <div className="px-6">
          <EmptyState
            icon="📣"
            title="No company updates"
            description="Company updates will appear here when the portfolio company publishes them."
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {orderedUpdates.map((update) => {
            const title = getUpdateTitle(update);
            const body = getUpdateBody(update);
            const date = update.created_at || update.updated_at;

            return (
              <article
                key={update.id}
                className="px-6 py-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="font-medium text-navy">
                      {title}
                    </h4>

                    {body && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                        {body}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(date)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                  {update.category && (
                    <span className="rounded-full border border-border bg-gray-50 px-2.5 py-1">
                      {String(update.category)
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (letter) =>
                          letter.toUpperCase(),
                        )}
                    </span>
                  )}

                  {update.created_by && (
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Company update
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
