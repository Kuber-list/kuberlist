import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { portfolioAPI } from "../../api/index.js";
import {
  PageHeader,
  Spinner,
  EmptyState,
  formatINR,
  formatDate,
} from "../../components/ui/index.jsx";
import {
  BriefcaseBusiness,
  Building2,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 border border-green-200";
    case "EXITED":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "WRITTEN_OFF":
      return "bg-red-100 text-red-700 border border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
}

function getCompany(investment) {
  return investment.listing || investment.external_organization || {};
}

function getCompanyName(investment) {
  return getCompany(investment).name || "Unnamed Company";
}

function getCompanySector(investment) {
  return getCompany(investment).sector || "Not specified";
}

function getCompanyStage(investment) {
  const stage = investment.listing?.stage;

  if (stage) {
    return stage.replace(/_/g, " ");
  }

  return investment.external_organization ? "External" : "—";
}

function SummaryCard({ icon: Icon, label, value, description }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-white px-5 py-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-dim">{description}</p>
          )}
        </div>
        <div className="rounded-lg bg-navy/5 p-2.5">
          <Icon size={20} className="text-navy" />
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();

  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError("");

      const [portfolioResponse, summaryResponse] = await Promise.all([
        portfolioAPI.getAll(),
        portfolioAPI.getSummary(),
      ]);

      setInvestments(portfolioResponse.data?.data || []);
      setSummary(summaryResponse.data?.data || null);
    } catch (err) {
      console.error("Failed to load seeker portfolio:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load portfolio. Please try again."
      );
      setInvestments([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="anim-up">
      <PageHeader
        title="Portfolio Management"
        subtitle="Monitor investors and investments across your companies"
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          icon={BriefcaseBusiness}
          label="Investments"
          value={summary?.total_investments ?? investments.length}
          description="Investments in your companies"
        />

        <SummaryCard
          icon={TrendingUp}
          label="Capital Invested"
          value={formatINR(summary?.total_invested ?? 0)}
          description="Reported invested amount"
        />

        <SummaryCard
          icon={Building2}
          label="Companies"
          value={
            new Set(
              investments
                .map((investment) => investment.listing_id)
                .filter(Boolean)
            ).size
          }
          description="Your companies with investment"
        />
      </div>

      {investments.length === 0 ? (
        <EmptyState
          icon="briefcase"
          title="No investments yet"
          description="Investments made into your companies will appear here once they are added to KuberList."
        />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-navy">
              Investor Portfolio
            </h2>
            <p className="mt-1 text-xs text-muted">
              Investments associated with your KuberList companies
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  {[
                    "Company",
                    "Investor",
                    "Investment",
                    "Instrument",
                    "Ownership",
                    "Status",
                    "Invested At",
                    "",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {investments.map((investment, index) => (
                  <tr
                    key={investment.id}
                    className={`border-b border-border/40 last:border-0 ${
                      index % 2 === 0 ? "" : "bg-bg/40"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-text">
                        {getCompanyName(investment)}
                      </div>
                      <div className="mt-0.5 text-xs capitalize text-dim">
                        {getCompanySector(investment)} ·{" "}
                        {getCompanyStage(investment)}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-text">
                        {investment.investor?.name || "Investor"}
                      </div>
                      {investment.investor?.email && (
                        <div className="mt-0.5 text-xs text-dim">
                          {investment.investor.email}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 font-semibold text-text">
                      {formatINR(Number(investment.invested_amount || 0))}
                    </td>

                    <td className="px-5 py-4 text-xs text-text">
                      {formatStatus(investment.instrument)}
                    </td>

                    <td className="px-5 py-4 text-xs text-text">
                      {investment.ownership_percentage !== null &&
                      investment.ownership_percentage !== undefined
                        ? `${investment.ownership_percentage}%`
                        : "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                          investment.status
                        )}`}
                      >
                        {formatStatus(investment.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-muted">
                      {investment.invested_at
                        ? formatDate(investment.invested_at)
                        : "—"}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/seeker/portfolio/${investment.id}`)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-navy transition hover:border-navy hover:bg-navy/5"
                      >
                        View
                        <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
