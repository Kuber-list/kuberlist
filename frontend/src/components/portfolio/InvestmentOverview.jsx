import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileCheck2,
  TrendingUp,
} from "lucide-react";

import { formatINR } from "../ui/index.jsx";

function formatDate(value) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCompanyName(investment) {
  return (
    investment?.listing?.name ||
    investment?.external_organization?.name ||
    "Unnamed Company"
  );
}

function getStage(investment) {
  if (!investment?.listing?.stage) {
    return investment?.external_organization ? "External" : "Not specified";
  }

  return investment.listing.stage
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCurrentValue(investment) {
  if (
    investment?.current_value_override !== null &&
    investment?.current_value_override !== undefined
  ) {
    return Number(investment.current_value_override);
  }

  if (investment?.status === "EXITED") {
    return Number(investment?.exit_value || 0);
  }

  return Number(investment?.invested_amount || 0);
}

function formatStatus(status) {
  if (!status) return "Not specified";

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MetricCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>

      <div className="text-xl font-semibold text-navy">{value}</div>

      {description && (
        <div className="mt-1 text-xs text-muted">{description}</div>
      )}
    </div>
  );
}

export default function InvestmentOverview({ investment, access }) {
  if (!investment) return null;

  const companyName = getCompanyName(investment);
  const investedAmount = Number(investment.invested_amount || 0);
  const currentValue = getCurrentValue(investment);

  const gainLoss = currentValue - investedAmount;
  const gainLossPercentage =
    investedAmount > 0 ? (gainLoss / investedAmount) * 100 : null;

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-muted">
              <Building2 className="h-5 w-5" />
              <span className="text-sm">Portfolio Investment</span>
            </div>

            <h2 className="font-display text-2xl font-semibold text-navy">
              {companyName}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{getStage(investment)}</span>
              <span>•</span>
              <span>{formatStatus(investment.status)}</span>
              {investment.instrument && (
                <>
                  <span>•</span>
                  <span>
                    {investment.instrument
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                  </span>
                </>
              )}
            </div>
          </div>

          {access?.can_manage_investment && (
            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
              Investor-managed
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CircleDollarSign}
          label="Invested"
          value={formatINR(investedAmount)}
          description="Original investment amount"
        />

        <MetricCard
          icon={TrendingUp}
          label="Current Value"
          value={formatINR(currentValue)}
          description="Current portfolio value"
        />

        <MetricCard
          icon={gainLoss >= 0 ? TrendingUp : TrendingUp}
          label="Gain / Loss"
          value={`${gainLoss >= 0 ? "+" : ""}${formatINR(gainLoss)}`}
          description={
            gainLossPercentage === null
              ? "Percentage unavailable"
              : `${gainLossPercentage >= 0 ? "+" : ""}${gainLossPercentage.toFixed(
                  1,
                )}% from invested amount`
          }
        />

        <MetricCard
          icon={CalendarDays}
          label="Investment Date"
          value={formatDate(investment.investment_date)}
          description="Date recorded in portfolio"
        />
      </div>

      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-navy" />
          <h3 className="font-display text-lg font-semibold text-navy">
            Investment Details
          </h3>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">
              Ownership
            </div>
            <div className="mt-1 text-sm font-medium text-navy">
              {investment.ownership_percentage !== null &&
              investment.ownership_percentage !== undefined
                ? `${Number(investment.ownership_percentage).toFixed(2)}%`
                : "Not recorded"}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-muted">
              Instrument
            </div>
            <div className="mt-1 text-sm font-medium text-navy">
              {investment.instrument
                ? investment.instrument
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (letter) => letter.toUpperCase())
                : "Not recorded"}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-muted">
              Status
            </div>
            <div className="mt-1 text-sm font-medium text-navy">
              {formatStatus(investment.status)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
