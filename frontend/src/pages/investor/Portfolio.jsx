import { useEffect, useMemo, useState } from "react";
import {
  portfolioAPI,
  secondaryOpportunityAPI,
  listingAPI,
} from "../../api/index.js";

import {
  PageHeader,
  Spinner,
  EmptyState,
  formatINR,
  Modal,
  Alert,
} from "../../components/ui/index.jsx";

import {
  BriefcaseBusiness,
  TrendingUp,
  TrendingDown,
  Building2,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Pencil,
  Trash2,
  Globe2,
} from "lucide-react";

const STATUS_OPTIONS = ["ALL", "ACTIVE", "EXITED", "WRITTEN_OFF"];

const INSTRUMENT_OPTIONS = [
  "EQUITY",
  "SAFE",
  "CONVERTIBLE_NOTE",
  "DEBT",
  "REVENUE_BASED_FINANCING",
  "OTHER",
];

function getCompany(investment) {
  return investment.listing || investment.external_organization || {};
}

function getCompanyName(investment) {
  const company = getCompany(investment);

  return company.name || "Unnamed Company";
}

function getCompanySector(investment) {
  const company = getCompany(investment);

  return company.sector || "Not specified";
}

function getCompanyStage(investment) {
  const company = investment.listing;

  if (company?.stage) {
    return company.stage.replace(/_/g, " ");
  }

  return investment.external_organization ? "External" : "";
}

function getCurrentValue(investment) {
  if (
    investment.current_value_override !== null &&
    investment.current_value_override !== undefined
  ) {
    return Number(investment.current_value_override);
  }

  if (investment.status === "EXITED") {
    return Number(investment.exit_value || 0);
  }

  return Number(investment.invested_amount || 0);
}

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

function SummaryCard({
  icon,
  label,
  value,
  description,
  valueClass = "text-navy",
}) {
  const Icon = icon;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-white px-5 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-dim uppercase tracking-[0.16em]">
            {label}
          </div>

          <div
            className={`font-display text-[28px] leading-tight font-semibold mt-3 ${valueClass}`}
          >
            {value}
          </div>

          <div className="text-sm text-muted mt-2">{description}</div>
        </div>

        <div className="w-14 h-14 rounded-2xl border border-gold/15 bg-gold/5 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-gold" />
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState({
    type: "",
    message: "",
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [addModal, setAddModal] = useState(false);

  const [investmentType, setInvestmentType] = useState("");

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sellStakeModal, setSellStakeModal] = useState(false);
  const [sellingInvestment, setSellingInvestment] = useState(null);
  const [sellStakeSaving, setSellStakeSaving] = useState(false);
  const [sellStakeError, setSellStakeError] = useState("");
  const [secondaryOpportunities, setSecondaryOpportunities] = useState([]);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [sellStakeForm, setSellStakeForm] = useState({
    sale_type: "FULL",
    ownership_percentage: "",
    asking_price: "",
    price_visibility: "PUBLIC",
    minimum_transaction_size: "",
    expires_at: "",
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    invested_amount: "",
    invested_at: "",
    instrument: "EQUITY",
    entry_valuation: "",
    ownership_percentage: "",
    status: "ACTIVE",
    current_value_override: "",
    exit_value: "",
    exited_at: "",
    notes: "",
  });
  const [form, setForm] = useState({
    listing_id: "",

    name: "",
    website: "",
    sector: "",
    country: "",
    description: "",

    invested_amount: "",
    invested_at: new Date().toISOString().split("T")[0],
    instrument: "EQUITY",
    entry_valuation: "",
    ownership_percentage: "",
    status: "ACTIVE",
    notes: "",
  });

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError("");

      const [portfolioResponse, summaryResponse] = await Promise.all([
        portfolioAPI.getAll(),
        portfolioAPI.getSummary(),
      ]);

      setInvestments(portfolioResponse.data.data || []);
      setSummary(summaryResponse.data.data || null);
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  };
  const loadSecondaryOpportunities = async () => {
    try {
      setSecondaryLoading(true);

      const { data } = await secondaryOpportunityAPI.getMy();

      setSecondaryOpportunities(data.data || []);
    } catch (error) {
      console.error("Failed to load secondary opportunities:", error);
    } finally {
      setSecondaryLoading(false);
    }
  };
  const handleSubmitSecondaryOpportunity = async (id) => {
    try {
      setSecondaryLoading(true);

      await secondaryOpportunityAPI.submit(id);

      await loadSecondaryOpportunities();
    } catch (error) {
      console.error("Failed to submit secondary opportunity:", error);
    } finally {
      setSecondaryLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
    loadSecondaryOpportunities();
  }, []);
  const openAddModal = () => {
    setFormError("");

    setInvestmentType("");

    setForm({
      listing_id: "",

      name: "",
      website: "",
      sector: "",
      country: "",
      description: "",

      invested_amount: "",
      invested_at: new Date().toISOString().split("T")[0],
      instrument: "EQUITY",
      entry_valuation: "",
      ownership_percentage: "",
      status: "ACTIVE",
      notes: "",
    });

    setAddModal(true);
  };

  const closeAddModal = () => {
    if (saving) return;

    setAddModal(false);
    setFormError("");
    setInvestmentType("");
  };

  const selectInvestmentType = async (type) => {
    setInvestmentType(type);
    setFormError("");

    if (type === "KUBERLIST" && listings.length === 0) {
      try {
        setLoadingListings(true);

        const response = await listingAPI.browse({
          limit: 100,
        });

        setListings(response.data.data?.listings || []);
      } catch (err) {
        console.error(err);

        setFormError(
          err.response?.data?.message || "Failed to load KuberList companies.",
        );
      } finally {
        setLoadingListings(false);
      }
    }
  };

  const setFormValue = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const buildInvestmentPayload = () => {
    const optionalNumber = (value) =>
      value === "" || value === null ? null : Number(value);

    return {
      invested_amount: Number(form.invested_amount),

      invested_at: form.invested_at,

      instrument: form.instrument,

      entry_valuation: optionalNumber(form.entry_valuation),

      ownership_percentage: optionalNumber(form.ownership_percentage),

      status: form.status,

      notes: form.notes.trim() || null,
    };
  };

  const saveInvestment = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!investmentType) {
      setFormError("Please select how you want to add the company.");

      return;
    }

    if (form.invested_amount === "" || Number(form.invested_amount) < 0) {
      setFormError("Please enter a valid invested amount.");

      return;
    }

    if (!form.invested_at) {
      setFormError("Please select the investment date.");

      return;
    }

    if (!form.instrument) {
      setFormError("Please select an investment instrument.");

      return;
    }

    if (
      form.ownership_percentage !== "" &&
      (Number(form.ownership_percentage) < 0 ||
        Number(form.ownership_percentage) > 100)
    ) {
      setFormError("Ownership percentage must be between 0 and 100.");

      return;
    }

    try {
      setSaving(true);

      const investmentPayload = buildInvestmentPayload();

      if (investmentType === "KUBERLIST") {
        if (!form.listing_id) {
          setFormError("Please select a KuberList company.");

          return;
        }

        await portfolioAPI.create({
          ...investmentPayload,

          listing_id: form.listing_id,
        });
      }

      if (investmentType === "EXTERNAL") {
        if (!form.name.trim()) {
          setFormError("Organization name is required.");

          return;
        }

        await portfolioAPI.createExternal({
          ...investmentPayload,

          name: form.name.trim(),
          website: form.website.trim() || null,
          sector: form.sector.trim() || null,
          country: form.country.trim() || null,
          description: form.description.trim() || null,
        });
      }

      setAddModal(false);
      setInvestmentType("");

      await loadPortfolio();
    } catch (err) {
      console.error(err);

      setFormError(err.response?.data?.message || "Failed to add investment.");
    } finally {
      setSaving(false);
    }
  };
  const handleEditClick = (investment) => {
    setEditingInvestment(investment);

    setEditForm({
      invested_amount: investment.invested_amount ?? "",
      invested_at: investment.invested_at
        ? investment.invested_at.split("T")[0]
        : "",
      instrument: investment.instrument || "EQUITY",
      entry_valuation: investment.entry_valuation ?? "",
      ownership_percentage: investment.ownership_percentage ?? "",
      status: investment.status || "ACTIVE",
      current_value_override: investment.current_value_override ?? "",
      exit_value: investment.exit_value ?? "",
      exited_at: investment.exited_at ? investment.exited_at.split("T")[0] : "",
      notes: investment.notes || "",
    });

    setEditError("");
    setEditModal(true);
  };
  const handleDeleteClick = (investment) => {
    setInvestmentToDelete(investment);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!investmentToDelete) return;

    try {
      setDeleting(true);

      await portfolioAPI.remove(investmentToDelete.id);

      setDeleteModal(false);
      setInvestmentToDelete(null);

      await loadPortfolio();

      setAlert({
        type: "success",
        message: "Investment deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete investment:", error);

      setAlert({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to delete investment. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };
  const handleViewDetails = (investment) => {
    setSelectedInvestment(investment);
    setDetailsModal(true);
  };

  const filteredInvestments = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return investments.filter((investment) => {
      const company = getCompany(investment);

      const matchesSearch =
        !searchValue ||
        company.name?.toLowerCase().includes(searchValue) ||
        company.sector?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "ALL" || investment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [investments, search, statusFilter]);

  const totalInvestments = summary?.total_investments ?? investments.length;

  const activeInvestments =
    summary?.active_investments ??
    investments.filter((item) => item.status === "ACTIVE").length;

  const totalInvested = summary?.total_invested ?? 0;

  const currentValue = summary?.current_value ?? 0;

  const gainLoss = summary?.unrealized_gain_loss ?? 0;

  const gainLossPercentage =
    totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

  return (
    <div className="anim-up max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-7">
        <div>
          <PageHeader
            title="Portfolio Management"
            subtitle="Track and manage your startup investments"
          />

          <div className="w-32 h-px bg-gold/50 mt-4" />
        </div>

        <button
          type="button"
          className="btn-gold inline-flex items-center justify-center gap-2 min-w-[175px] h-12 px-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          onClick={openAddModal}
        >
          <Plus className="w-[18px] h-[18px]" />
          Add Investment
        </button>
      </div>
      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() =>
            setAlert({
              type: "",
              message: "",
            })
          }
        />
      )}
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="card text-center py-10">
          <p className="text-red-600 font-medium">{error}</p>

          <button
            type="button"
            onClick={loadPortfolio}
            className="btn-navy mt-4"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            <SummaryCard
              icon={Wallet}
              label="Total Invested"
              value={formatINR(totalInvested)}
              description={`Across ${totalInvestments} investment${
                totalInvestments !== 1 ? "s" : ""
              }`}
            />

            <SummaryCard
              icon={BriefcaseBusiness}
              label="Current Portfolio Value"
              value={formatINR(currentValue)}
              description="Based on reported portfolio values"
            />

            <SummaryCard
              icon={gainLoss >= 0 ? TrendingUp : TrendingDown}
              label="Unrealized Gain / Loss"
              value={`${gainLoss >= 0 ? "+" : ""}${formatINR(gainLoss)}`}
              description={`${
                gainLossPercentage >= 0 ? "+" : ""
              }${gainLossPercentage.toFixed(1)}% overall`}
              valueClass={
                gainLoss > 0
                  ? "text-green-600"
                  : gainLoss < 0
                    ? "text-red-600"
                    : "text-navy"
              }
            />

            <SummaryCard
              icon={Building2}
              label="Investments"
              value={totalInvestments}
              description={`${activeInvestments} active · ${
                summary?.exited_investments || 0
              } exited`}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-dim mb-6 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold/70" />

            <p>
              Portfolio values are indicative and based on the latest available
              investment or reported valuation data.
            </p>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-navy">
                    Portfolio Companies
                  </h2>

                  <p className="text-sm text-muted mt-1">
                    {filteredInvestments.length} of {investments.length}{" "}
                    investment
                    {investments.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-dim absolute left-3 top-1/2 -translate-y-1/2" />

                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search company"
                      className="input pl-9 w-full sm:w-56"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="input w-full sm:w-40"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status === "ALL"
                          ? "All Statuses"
                          : formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {filteredInvestments.length === 0 ? (
              investments.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon="💼"
                    title="No investments yet"
                    description="Start building your portfolio by adding an investment from KuberList or an external organization."
                    action={
                      <button
                        type="button"
                        className="btn-gold inline-flex items-center gap-2"
                        onClick={openAddModal}
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Investment
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="p-10 text-center">
                  <Search className="w-8 h-8 text-dim mx-auto mb-3" />

                  <h3 className="font-semibold text-navy">
                    No matching investments
                  </h3>

                  <p className="text-sm text-muted mt-1">
                    Try changing your search or status filter.
                  </p>
                </div>
              )
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80">
                      <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">
                        Company
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-dim whitespace-nowrap">
                        Invested Amount
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-dim whitespace-nowrap">
                        Current Value
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-dim whitespace-nowrap">
                        Gain / Loss
                      </th>

                      <th className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">
                        Status
                      </th>

                      <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-dim whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredInvestments.map((investment) => {
                      const companyName = getCompanyName(investment);
                      const sector = getCompanySector(investment);
                      const stage = getCompanyStage(investment);

                      const investedAmount = Number(
                        investment.invested_amount || 0,
                      );

                      const currentInvestmentValue =
                        getCurrentValue(investment);

                      const investmentGainLoss =
                        currentInvestmentValue - investedAmount;

                      const investmentGainLossPercentage =
                        investedAmount > 0
                          ? (investmentGainLoss / investedAmount) * 100
                          : 0;

                      const isPositive = investmentGainLoss > 0;
                      const isNegative = investmentGainLoss < 0;

                      const initials = companyName
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr
                          key={investment.id}
                          onClick={() => handleViewDetails(investment)}
                          className="border-b border-gray-100 last:border-0 cursor-pointer transition-colors hover:bg-gold/[0.04]"
                        >
                          {/* Company */}
                          <td className="px-4 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-navy/5 border border-navy/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-navy">
                                  {initials}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => handleViewDetails(investment)}
                                  className="font-semibold text-navy text-[15px] text-left hover:text-gold transition-colors"
                                >
                                  {companyName}
                                </button>

                                <div className="text-xs text-muted mt-1">
                                  {sector}
                                  {stage ? ` · ${stage}` : ""}
                                </div>

                                {investment.notes && (
                                  <div
                                    className="text-xs text-dim mt-1 max-w-[180px] truncate"
                                    title={investment.notes}
                                  >
                                    {investment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Invested Amount */}
                          <td className="px-4 py-5 whitespace-nowrap">
                            <div className="font-semibold text-navy">
                              {formatINR(investedAmount)}
                            </div>

                            <div className="text-xs text-muted mt-1">
                              {investment.invested_at
                                ? new Date(
                                    investment.invested_at,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </div>
                          </td>

                          {/* Current Value */}
                          <td className="px-4 py-5 whitespace-nowrap">
                            <div className="font-semibold text-navy">
                              {formatINR(currentInvestmentValue)}
                            </div>

                            <div className="text-xs text-muted mt-1">
                              {investment.current_value_override !== null &&
                              investment.current_value_override !== undefined
                                ? "Reported value"
                                : investment.status === "EXITED"
                                  ? "Exit value"
                                  : "Investment value"}
                            </div>
                          </td>

                          {/* Gain / Loss */}
                          <td className="px-4 py-5 whitespace-nowrap">
                            <div
                              className={`flex items-center gap-1.5 font-semibold ${
                                isPositive
                                  ? "text-green-700"
                                  : isNegative
                                    ? "text-red-600"
                                    : "text-muted"
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : isNegative ? (
                                <ArrowDownRight className="w-4 h-4" />
                              ) : null}

                              <span>
                                {investmentGainLoss === 0
                                  ? "—"
                                  : `${isPositive ? "+" : ""}${formatINR(
                                      investmentGainLoss,
                                    )}`}
                              </span>
                            </div>

                            <div className="text-xs text-muted mt-1">
                              {investmentGainLossPercentage === 0
                                ? "+0.0%"
                                : `${investmentGainLossPercentage > 0 ? "+" : ""}${investmentGainLossPercentage.toFixed(
                                    1,
                                  )}%`}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                                investment.status,
                              )}`}
                            >
                              {formatStatus(investment.status)}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-5 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {investment.status === "ACTIVE" && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSellingInvestment(investment);
                                    setSellStakeModal(true);
                                  }}
                                  className="h-9 px-3 rounded-lg border border-gold/30 flex items-center justify-center text-xs font-semibold text-gold transition-all hover:bg-gold/5 hover:border-gold/60"
                                  title="Sell stake"
                                >
                                  Sell Stake
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEditClick(investment);
                                }}
                                className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-muted transition-all hover:border-gold/50 hover:bg-gold/5 hover:text-gold"
                                title="Edit investment"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteClick(investment);
                                }}
                                className="w-9 h-9 rounded-lg border border-red-100 flex items-center justify-center text-red-500 transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                                title="Delete investment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      {/* Secondary Opportunities */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-navy">
              My Secondary Opportunities
            </h2>

            <p className="text-sm text-muted mt-1">
              Track stake sale opportunities you have created.
            </p>
          </div>
        </div>

        {secondaryLoading ? (
          <div className="px-6 py-8 text-sm text-muted">
            Loading secondary opportunities...
          </div>
        ) : secondaryOpportunities.length === 0 ? (
          <div className="px-6 py-8 text-sm text-muted">
            You haven't created any secondary opportunities yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {secondaryOpportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                className="px-6 py-5 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-navy">
                    {opportunity.listing?.name ||
                      opportunity.external_organization?.name ||
                      "Unknown Organization"}
                  </div>

                  <div className="text-sm text-muted mt-1">
                    {opportunity.sale_type === "FULL"
                      ? "Full Stake"
                      : "Partial Stake"}
                    {" · "}
                    {formatINR(opportunity.asking_price)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600">
                    {opportunity.status}
                  </span>

                  {opportunity.status === "DRAFT" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSubmitSecondaryOpportunity(opportunity.id)
                      }
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Submit for Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={addModal}
        onClose={closeAddModal}
        title="Add Investment"
        maxWidth="max-w-3xl"
      >
        <form
          onSubmit={saveInvestment}
          className="max-h-[70vh] overflow-y-auto pr-2"
        >
          <div className="space-y-6">
            {formError && (
              <Alert
                type="error"
                message={formError}
                onClose={() => setFormError("")}
              />
            )}

            {!investmentType ? (
              <>
                <div>
                  <h3 className="text-base font-semibold text-navy">
                    Choose Investment Type
                  </h3>

                  <p className="text-sm text-muted mt-1">
                    Select where this investment should be added from.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => selectInvestmentType("KUBERLIST")}
                    className="rounded-xl border border-border hover:border-gold hover:bg-gold/5 p-5 text-left transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                      <Building2 className="w-5 h-5 text-gold" />
                    </div>

                    <h3 className="font-semibold text-navy">
                      KuberList Company
                    </h3>

                    <p className="text-sm text-muted mt-1.5 leading-relaxed">
                      Select a startup or SME already listed on KuberList.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectInvestmentType("EXTERNAL")}
                    className="rounded-xl border border-border hover:border-gold hover:bg-gold/5 p-5 text-left transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                      <Globe2 className="w-5 h-5 text-gold" />
                    </div>

                    <h3 className="font-semibold text-navy">
                      External Organization
                    </h3>

                    <p className="text-sm text-muted mt-1.5 leading-relaxed">
                      Add a company that is not currently on KuberList.
                    </p>
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Selected Investment Type */}
                <div className="flex items-start justify-between gap-4 pb-5 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                        {investmentType === "KUBERLIST" ? (
                          <Building2 className="w-4 h-4 text-gold" />
                        ) : (
                          <Globe2 className="w-4 h-4 text-gold" />
                        )}
                      </div>

                      <div>
                        <div className="font-semibold text-navy">
                          {investmentType === "KUBERLIST"
                            ? "KuberList Company"
                            : "External Organization"}
                        </div>

                        <div className="text-xs text-muted mt-0.5">
                          {investmentType === "KUBERLIST"
                            ? "Select a company already available on KuberList."
                            : "Enter details for an organization outside KuberList."}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-sm font-medium text-gold hover:underline"
                    onClick={() => {
                      setInvestmentType("");
                      setFormError("");
                    }}
                  >
                    Change
                  </button>
                </div>

                {/* Organization Details */}
                <div>
                  <h3 className="text-sm font-semibold text-navy mb-4">
                    Organization Details
                  </h3>

                  {investmentType === "KUBERLIST" && (
                    <div>
                      <label className="label">Select Company</label>

                      {loadingListings ? (
                        <div className="flex justify-center py-8 border border-border rounded-xl">
                          <Spinner size="sm" />
                        </div>
                      ) : (
                        <select
                          value={form.listing_id}
                          onChange={(event) =>
                            setFormValue("listing_id", event.target.value)
                          }
                          className="input"
                          required
                        >
                          <option value="">Select a company</option>

                          {listings.map((listing) => (
                            <option key={listing.id} value={listing.id}>
                              {listing.name}
                              {listing.sector ? ` · ${listing.sector}` : ""}
                              {listing.stage
                                ? ` · ${listing.stage.replace(/_/g, " ")}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      )}

                      {!loadingListings && listings.length === 0 && (
                        <p className="text-sm text-muted mt-2">
                          No active KuberList companies are currently available.
                        </p>
                      )}
                    </div>
                  )}

                  {investmentType === "EXTERNAL" && (
                    <div className="space-y-4">
                      <div>
                        <label className="label">Organization Name</label>

                        <input
                          type="text"
                          value={form.name}
                          onChange={(event) =>
                            setFormValue("name", event.target.value)
                          }
                          className="input"
                          placeholder="Company name"
                          required
                        />
                      </div>

                      <div>
                        <label className="label">
                          Website
                          <span className="text-muted font-normal">
                            {" "}
                            (optional)
                          </span>
                        </label>

                        <input
                          type="url"
                          value={form.website}
                          onChange={(event) =>
                            setFormValue("website", event.target.value)
                          }
                          className="input"
                          placeholder="https://example.com"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Sector</label>

                          <input
                            type="text"
                            value={form.sector}
                            onChange={(event) =>
                              setFormValue("sector", event.target.value)
                            }
                            className="input"
                            placeholder="e.g. FinTech"
                          />
                        </div>

                        <div>
                          <label className="label">Country</label>

                          <input
                            type="text"
                            value={form.country}
                            onChange={(event) =>
                              setFormValue("country", event.target.value)
                            }
                            className="input"
                            placeholder="e.g. India"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="label">
                          Description
                          <span className="text-muted font-normal">
                            {" "}
                            (optional)
                          </span>
                        </label>

                        <textarea
                          value={form.description}
                          onChange={(event) =>
                            setFormValue("description", event.target.value)
                          }
                          rows={3}
                          className="input resize-none"
                          placeholder="Brief description of the organization"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Investment Details */}
                <div className="pt-5 border-t border-border">
                  <h3 className="text-sm font-semibold text-navy mb-4">
                    Investment Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Invested Amount</label>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={form.invested_amount}
                        onChange={(event) =>
                          setFormValue("invested_amount", event.target.value)
                        }
                        className="input"
                        placeholder="500000"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Investment Date</label>

                      <input
                        type="date"
                        value={form.invested_at}
                        onChange={(event) =>
                          setFormValue("invested_at", event.target.value)
                        }
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Instrument</label>

                      <select
                        value={form.instrument}
                        onChange={(event) =>
                          setFormValue("instrument", event.target.value)
                        }
                        className="input"
                      >
                        {INSTRUMENT_OPTIONS.map((instrument) => (
                          <option key={instrument} value={instrument}>
                            {formatStatus(instrument)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Status</label>

                      <select
                        value={form.status}
                        onChange={(event) =>
                          setFormValue("status", event.target.value)
                        }
                        className="input"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="EXITED">Exited</option>
                        <option value="WRITTEN_OFF">Written Off</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Valuation & Ownership */}
                <div className="pt-5 border-t border-border">
                  <h3 className="text-sm font-semibold text-navy mb-4">
                    Valuation & Ownership
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        Entry Valuation
                        <span className="text-muted font-normal">
                          {" "}
                          (optional)
                        </span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={form.entry_valuation}
                        onChange={(event) =>
                          setFormValue("entry_valuation", event.target.value)
                        }
                        className="input"
                        placeholder="25000000"
                      />
                    </div>

                    <div>
                      <label className="label">
                        Ownership %
                        <span className="text-muted font-normal">
                          {" "}
                          (optional)
                        </span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={form.ownership_percentage}
                        onChange={(event) =>
                          setFormValue(
                            "ownership_percentage",
                            event.target.value,
                          )
                        }
                        className="input"
                        placeholder="2"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="pt-5 border-t border-border">
                  <h3 className="text-sm font-semibold text-navy mb-4">
                    Notes
                  </h3>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setFormValue("notes", event.target.value)
                    }
                    rows={4}
                    className="input resize-none"
                    placeholder="Add any relevant notes about this investment..."
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-border">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    disabled={saving}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      (investmentType === "KUBERLIST" && loadingListings)
                    }
                    className="btn-gold inline-flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Spinner size="sm" />
                        Saving...
                      </>
                    ) : (
                      "Save Investment"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </Modal>
      {/* Edit Investment Modal */}
      <Modal
        open={editModal}
        title="Edit Investment"
        onClose={() => {
          setEditModal(false);
          setEditingInvestment(null);
          setEditError("");
        }}
        maxWidth="max-w-3xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            if (!editingInvestment) return;

            try {
              setEditSaving(true);
              setEditError("");

              await portfolioAPI.update(editingInvestment.id, {
                invested_amount: Number(editForm.invested_amount),
                invested_at: editForm.invested_at,
                instrument: editForm.instrument,
                entry_valuation: editForm.entry_valuation
                  ? Number(editForm.entry_valuation)
                  : null,
                ownership_percentage: editForm.ownership_percentage
                  ? Number(editForm.ownership_percentage)
                  : null,
                status: editForm.status,
                current_value_override: editForm.current_value_override
                  ? Number(editForm.current_value_override)
                  : null,
                exit_value: editForm.exit_value
                  ? Number(editForm.exit_value)
                  : null,
                exited_at: editForm.exited_at || null,
                notes: editForm.notes || null,
              });

              setEditModal(false);
              setEditingInvestment(null);

              await loadPortfolio();
            } catch (error) {
              setEditError(
                error?.response?.data?.message || "Failed to update investment",
              );
            } finally {
              setEditSaving(false);
            }
          }}
          className="max-h-[70vh] overflow-y-auto pr-2"
        >
          <div className="space-y-6">
            {editError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {editError}
              </div>
            )}

            {/* Investment Details */}
            <div>
              <h3 className="text-sm font-semibold text-navy mb-4">
                Investment Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Invested Amount</label>
                  <input
                    type="number"
                    value={editForm.invested_amount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        invested_amount: e.target.value,
                      })
                    }
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Investment Date</label>
                  <input
                    type="date"
                    value={editForm.invested_at}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        invested_at: e.target.value,
                      })
                    }
                    className="input"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Instrument</label>
                  <select
                    value={editForm.instrument}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        instrument: e.target.value,
                      })
                    }
                    className="input"
                  >
                    <option value="EQUITY">Equity</option>
                    <option value="DEBT">Debt</option>
                    <option value="SAFE">SAFE</option>
                    <option value="CONVERTIBLE_NOTE">Convertible Note</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Valuation & Ownership */}
            <div className="pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-navy mb-4">
                Valuation & Ownership
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Entry Valuation</label>
                  <input
                    type="number"
                    value={editForm.entry_valuation}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        entry_valuation: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="label">Ownership Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.ownership_percentage}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        ownership_percentage: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="Optional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Current Value Override</label>
                  <input
                    type="number"
                    value={editForm.current_value_override}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        current_value_override: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="Leave empty to use the calculated value"
                  />
                </div>
              </div>
            </div>

            {/* Status & Exit */}
            <div className="pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-navy mb-4">
                Status & Exit
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value,
                      })
                    }
                    className="input"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="EXITED">Exited</option>
                    <option value="WRITTEN_OFF">Written Off</option>
                  </select>
                </div>

                <div>
                  <label className="label">Exit Value</label>
                  <input
                    type="number"
                    value={editForm.exit_value}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        exit_value: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="label">Exit Date</label>
                  <input
                    type="date"
                    value={editForm.exited_at}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        exited_at: e.target.value,
                      })
                    }
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-navy mb-4">Notes</h3>

              <textarea
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    notes: e.target.value,
                  })
                }
                className="input min-h-[110px]"
                placeholder="Add any relevant notes about this investment..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-border">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditModal(false);
                  setEditingInvestment(null);
                  setEditError("");
                }}
              >
                Cancel
              </button>

              <button type="submit" className="btn-gold" disabled={editSaving}>
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
      <Modal
        open={detailsModal}
        onClose={() => {
          setDetailsModal(false);
          setSelectedInvestment(null);
        }}
        title="Investment Details"
        maxWidth="max-w-3xl"
      >
        {selectedInvestment &&
          (() => {
            const company = getCompany(selectedInvestment);

            const investedAmount = Number(
              selectedInvestment.invested_amount || 0,
            );

            const currentInvestmentValue = getCurrentValue(selectedInvestment);

            const investmentGainLoss = currentInvestmentValue - investedAmount;

            const investmentGainLossPercentage =
              investedAmount > 0
                ? (investmentGainLoss / investedAmount) * 100
                : 0;

            const isPositive = investmentGainLoss > 0;
            const isNegative = investmentGainLoss < 0;

            return (
              <div className="space-y-6">
                {/* Company Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-gold" />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-navy">
                        {getCompanyName(selectedInvestment)}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="text-sm text-muted">
                          {getCompanySector(selectedInvestment)}
                        </span>

                        {getCompanyStage(selectedInvestment) && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted" />

                            <span className="text-sm text-muted">
                              {getCompanyStage(selectedInvestment)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`self-start sm:self-auto inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(
                      selectedInvestment.status,
                    )}`}
                  >
                    {formatStatus(selectedInvestment.status)}
                  </span>
                </div>

                {/* Key Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-border">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">
                      Invested Amount
                    </div>

                    <div className="font-display text-xl font-semibold text-navy mt-2">
                      {formatINR(investedAmount)}
                    </div>

                    <div className="text-xs text-muted mt-1">
                      Capital deployed
                    </div>
                  </div>

                  <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-border">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">
                      Current Value
                    </div>

                    <div className="font-display text-xl font-semibold text-navy mt-2">
                      {formatINR(currentInvestmentValue)}
                    </div>

                    <div className="text-xs text-muted mt-1">Latest value</div>
                  </div>

                  <div className="px-5 py-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">
                      Gain / Loss
                    </div>

                    <div
                      className={`flex items-center gap-1 font-display text-xl font-semibold mt-2 ${
                        isPositive
                          ? "text-green-600"
                          : isNegative
                            ? "text-red-600"
                            : "text-navy"
                      }`}
                    >
                      {isPositive && <ArrowUpRight className="w-5 h-5" />}

                      {isNegative && <ArrowDownRight className="w-5 h-5" />}

                      {investmentGainLoss === 0
                        ? "—"
                        : `${isPositive ? "+" : ""}${formatINR(
                            investmentGainLoss,
                          )}`}
                    </div>

                    <div
                      className={`text-xs mt-1 ${
                        isPositive
                          ? "text-green-600"
                          : isNegative
                            ? "text-red-600"
                            : "text-muted"
                      }`}
                    >
                      {investmentGainLoss === 0
                        ? "No change"
                        : `${investmentGainLossPercentage > 0 ? "+" : ""}${investmentGainLossPercentage.toFixed(
                            1,
                          )}% return`}
                    </div>
                  </div>
                </div>

                {/* Investment Details */}
                <div>
                  <h4 className="text-sm font-semibold text-navy mb-3">
                    Investment Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b sm:border-r border-border">
                      <div className="text-[11px] uppercase tracking-wide text-dim">
                        Investment Date
                      </div>

                      <div className="text-sm font-semibold text-navy mt-1.5">
                        {selectedInvestment.invested_at
                          ? new Date(
                              selectedInvestment.invested_at,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                    </div>

                    <div className="px-5 py-4 border-b border-border">
                      <div className="text-[11px] uppercase tracking-wide text-dim">
                        Instrument
                      </div>

                      <div className="text-sm font-semibold text-navy mt-1.5">
                        {formatStatus(selectedInvestment.instrument)}
                      </div>
                    </div>

                    <div className="px-5 py-4 sm:border-r border-border">
                      <div className="text-[11px] uppercase tracking-wide text-dim">
                        Entry Valuation
                      </div>

                      <div className="text-sm font-semibold text-navy mt-1.5">
                        {selectedInvestment.entry_valuation
                          ? formatINR(selectedInvestment.entry_valuation)
                          : "—"}
                      </div>
                    </div>

                    <div className="px-5 py-4">
                      <div className="text-[11px] uppercase tracking-wide text-dim">
                        Ownership
                      </div>

                      <div className="text-sm font-semibold text-navy mt-1.5">
                        {selectedInvestment.ownership_percentage !== null &&
                        selectedInvestment.ownership_percentage !== undefined
                          ? `${selectedInvestment.ownership_percentage}%`
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {((selectedInvestment.current_value_override !== null &&
                  selectedInvestment.current_value_override !== undefined) ||
                  selectedInvestment.status === "EXITED") && (
                  <div>
                    <h4 className="text-sm font-semibold text-navy mb-3">
                      Additional Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedInvestment.current_value_override !== null &&
                        selectedInvestment.current_value_override !==
                          undefined && (
                          <div className="rounded-xl border border-border px-4 py-3">
                            <div className="text-[11px] uppercase tracking-wide text-dim">
                              Current Value Override
                            </div>

                            <div className="text-sm font-semibold text-navy mt-1.5">
                              {formatINR(
                                selectedInvestment.current_value_override,
                              )}
                            </div>
                          </div>
                        )}

                      {selectedInvestment.status === "EXITED" && (
                        <>
                          <div className="rounded-xl border border-border px-4 py-3">
                            <div className="text-[11px] uppercase tracking-wide text-dim">
                              Exit Value
                            </div>

                            <div className="text-sm font-semibold text-navy mt-1.5">
                              {selectedInvestment.exit_value
                                ? formatINR(selectedInvestment.exit_value)
                                : "—"}
                            </div>
                          </div>

                          <div className="rounded-xl border border-border px-4 py-3">
                            <div className="text-[11px] uppercase tracking-wide text-dim">
                              Exit Date
                            </div>

                            <div className="text-sm font-semibold text-navy mt-1.5">
                              {selectedInvestment.exited_at
                                ? new Date(
                                    selectedInvestment.exited_at,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "—"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <h4 className="text-sm font-semibold text-navy mb-3">
                    Notes
                  </h4>

                  <div className="rounded-xl border border-border bg-gray-50/60 px-5 py-4">
                    <p className="text-sm leading-relaxed text-muted whitespace-pre-wrap">
                      {selectedInvestment.notes ||
                        "No notes added for this investment."}
                    </p>
                  </div>
                </div>

                {/* Company Information */}
                {(company.website ||
                  company.country ||
                  company.location_city ||
                  company.location_country) && (
                  <div>
                    <h4 className="text-sm font-semibold text-navy mb-3">
                      Company Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {company.website && (
                        <div className="rounded-xl border border-border px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-dim">
                            Website
                          </div>

                          <div className="text-sm font-medium text-navy mt-1.5 break-all">
                            {company.website}
                          </div>
                        </div>
                      )}

                      {(company.country ||
                        company.location_city ||
                        company.location_country) && (
                        <div className="rounded-xl border border-border px-4 py-3">
                          <div className="text-[11px] uppercase tracking-wide text-dim">
                            Location
                          </div>

                          <div className="text-sm font-medium text-navy mt-1.5">
                            {company.location_city
                              ? `${company.location_city}, `
                              : ""}
                            {company.location_country || company.country || "—"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setDetailsModal(false);
                      setSelectedInvestment(null);
                    }}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="btn-gold inline-flex items-center justify-center gap-2"
                    onClick={() => {
                      setDetailsModal(false);
                      handleEditClick(selectedInvestment);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Investment
                  </button>
                </div>
              </div>
            );
          })()}
      </Modal>
      <Modal
        open={deleteModal}
        onClose={() => {
          if (deleting) return;

          setDeleteModal(false);
          setInvestmentToDelete(null);
        }}
        title="Delete Investment"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-navy">
                Remove this investment?
              </h3>

              <p className="text-sm text-muted mt-2 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-navy">
                  {investmentToDelete
                    ? getCompanyName(investmentToDelete)
                    : "this investment"}
                </span>{" "}
                from your portfolio?
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
            <p className="text-xs text-red-600">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              className="btn-secondary"
              disabled={deleting}
              onClick={() => {
                setDeleteModal(false);
                setInvestmentToDelete(null);
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />

              {deleting ? "Deleting..." : "Delete Investment"}
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        open={sellStakeModal}
        title="Sell Stake"
        onClose={() => {
          setSellStakeModal(false);
          setSellingInvestment(null);
        }}
      >
        {sellingInvestment && (
          <div>
            <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs text-muted mb-1">
                Selling investment in
              </div>

              <div className="font-semibold text-navy">
                {getCompanyName(sellingInvestment)}
              </div>
            </div>
            {sellStakeError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {sellStakeError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sale Type */}
              <div>
                <label className="label">Sale Type</label>

                <select
                  value={sellStakeForm.sale_type}
                  onChange={(e) =>
                    setSellStakeForm({
                      ...sellStakeForm,
                      sale_type: e.target.value,
                    })
                  }
                  className="input"
                >
                  <option value="FULL">Full Stake</option>
                  <option value="PARTIAL">Partial Stake</option>
                </select>
              </div>

              {/* Asking Price */}
              <div>
                <label className="label">Asking Price</label>

                <input
                  type="number"
                  value={sellStakeForm.asking_price}
                  onChange={(e) =>
                    setSellStakeForm({
                      ...sellStakeForm,
                      asking_price: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="Enter asking price"
                  required
                />
              </div>

              {/* Ownership Percentage */}
              <div>
                <label className="label">Ownership Percentage</label>

                <input
                  type="number"
                  step="0.01"
                  value={sellStakeForm.ownership_percentage}
                  onChange={(e) =>
                    setSellStakeForm({
                      ...sellStakeForm,
                      ownership_percentage: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="Optional"
                />
              </div>

              {/* Price Visibility */}
              <div>
                <label className="label">Price Visibility</label>

                <select
                  value={sellStakeForm.price_visibility}
                  onChange={(e) =>
                    setSellStakeForm({
                      ...sellStakeForm,
                      price_visibility: e.target.value,
                    })
                  }
                  className="input"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="ON_REQUEST">On Request</option>
                </select>
              </div>

              {/* Minimum Transaction Size */}
              <div>
                <label className="label">Minimum Transaction Size</label>

                <input
                  type="number"
                  value={sellStakeForm.minimum_transaction_size}
                  onChange={(e) =>
                    setSellStakeForm({
                      ...sellStakeForm,
                      minimum_transaction_size: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="Optional"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="label">Expiry Date</label>

                <input
                  type="date"
                  value={sellStakeForm.expires_at}
                  onChange={(e) =>
                    setSellStakeForm({
                      ...sellStakeForm,
                      expires_at: e.target.value,
                    })
                  }
                  className="input"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="label">Notes</label>

                <textarea
                  value={sellStakeForm.notes}
                  onChange={(e) =>
                    setSellStakeForm({
                      ...sellStakeForm,
                      notes: e.target.value,
                    })
                  }
                  className="input min-h-[100px]"
                  placeholder="Optional notes about this stake sale"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSellStakeModal(false);
                  setSellingInvestment(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={sellStakeSaving}
                onClick={async () => {
                  if (!sellingInvestment) return;

                  try {
                    setSellStakeSaving(true);
                    setSellStakeError("");

                    await secondaryOpportunityAPI.create({
                      investment_id: sellingInvestment.id,
                      instrument: sellingInvestment.instrument || "EQUITY",
                      sale_type: sellStakeForm.sale_type,

                      ownership_percentage: sellStakeForm.ownership_percentage
                        ? Number(sellStakeForm.ownership_percentage)
                        : null,

                      asking_price: Number(sellStakeForm.asking_price),

                      price_visibility: sellStakeForm.price_visibility,

                      minimum_transaction_size:
                        sellStakeForm.minimum_transaction_size
                          ? Number(sellStakeForm.minimum_transaction_size)
                          : null,

                      expires_at: sellStakeForm.expires_at || null,

                      notes: sellStakeForm.notes || null,
                    });

                    setSellStakeModal(false);
                    setSellingInvestment(null);

                    setSellStakeForm({
                      sale_type: "FULL",
                      ownership_percentage: "",
                      asking_price: "",
                      price_visibility: "PUBLIC",
                      minimum_transaction_size: "",
                      expires_at: "",
                      notes: "",
                    });
                  } catch (error) {
                    setSellStakeError(
                      error?.response?.data?.message ||
                        "Failed to create secondary opportunity",
                    );
                  } finally {
                    setSellStakeSaving(false);
                  }
                }}
                className="btn-primary"
              >
                {sellStakeSaving ? "Creating..." : "Create Draft"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
