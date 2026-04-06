import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Undo2,
  Download,
  Calendar,
  BarChart3,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  ArrowUpRight,
  Briefcase,
  Wallet,
  Scale,
} from "lucide-react";

import { formatCurrency } from "../utils/financeUtils";

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

// Generate year options from 2024 to current year + 1
const currentYear = new Date().getFullYear();
const YEARS = [
  { value: "", label: "All Time" },
  ...Array.from({ length: currentYear - 2023 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  })),
];

// formatCurrency imported from ../utils/financeUtils

const FinancialAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedYear) params.year = selectedYear;
      if (selectedMonth) params.month = selectedMonth;
      const { data: result } = await api.get("/analytics/financial", {
        params,
      });
      setData(result);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error("Failed to load financial analytics");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (selectedYear) params.year = selectedYear;
      if (selectedMonth) params.month = selectedMonth;

      const response = await api.get("/analytics/export", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      let filename = "BuildLink_Financial_Report";
      if (selectedYear) filename += `_${selectedYear}`;
      if (selectedMonth) filename += `_${selectedMonth.padStart(2, "0")}`;
      filename += ".csv";

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  // Derive the filter label for display
  const filterLabel = (() => {
    if (!selectedYear) return "All Time";
    const monthLabel = selectedMonth
      ? MONTHS.find((m) => m.value === selectedMonth)?.label
      : "";
    return monthLabel
      ? `${monthLabel} ${selectedYear}`
      : `Year ${selectedYear}`;
  })();

  // ── LOADING STATE ──
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-sm opacity-60 animate-pulse">
          Loading financial analytics...
        </p>
      </div>
    );
  }

  const {
    // ── Completed bookings (non-disputed) ──
    completedVolume = 0,
    completedAdmin = 0,
    completedContractor = 0,
    completedBookings = 0,
    completedCases = [],

    // ── Disputed bookings ──
    disputedVolume = 0,
    disputeAdmin = 0,
    disputeContractor = 0,
    disputeRefunds = 0,
    disputeCount = 0,
    disputeBreakdown = {
      refund: { count: 0, volume: 0, admin: 0, contractor: 0, refund: 0 },
      release: { count: 0, volume: 0, admin: 0, contractor: 0, refund: 0 },
      split: { count: 0, volume: 0, admin: 0, contractor: 0, refund: 0 },
    },
    disputeCases = [],

    // ── Aggregated totals ──
    totalPlatformVolume = 0,
    totalAdminCommission = 0,
    totalContractorPayouts = 0,
    totalRevenue = 0,

    commissionRate = 0.05,
    trend = [],
    topServices = [],
  } = data || {};

  // No client-side math needed — backend sends pre-computed values
  // that each satisfy their equation exactly (remainder method).

  // Determine max value for bar chart scale
  const maxTrendSpend = Math.max(...trend.map((t) => t.spend), 1);
  const totalTopServicesRevenue = topServices.reduce(
    (sum, service) => sum + (service.revenue || 0),
    0,
  );
  const disputeDecisionRows = [
    {
      key: "refund",
      label: "Refund Decisions",
      rule: "Admin 0% • Contractor 0% • User 100%",
      data: disputeBreakdown?.refund || {},
    },
    {
      key: "release",
      label: "Release Decisions",
      rule: "Admin 5% • Contractor 95% • User 0%",
      data: disputeBreakdown?.release || {},
    },
    {
      key: "split",
      label: "Split Decisions",
      rule: "Admin 5% • Remaining 95% split equally",
      data: disputeBreakdown?.split || {},
    },
  ].filter((row) => (row.data?.count || 0) > 0);

  return (
    <div className="space-y-8">
      {/* ── HEADER & FILTERS ────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <BarChart3 size={28} className="text-primary" />
            Financial Analytics
          </h2>
          <p className="text-sm opacity-60 mt-1">
            Platform performance metrics — {filterLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year Filter */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                if (!e.target.value) setSelectedMonth("");
              }}
              className="select select-bordered select-sm pr-8 font-medium"
            >
              {YEARS.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter (only when year is selected) */}
          {selectedYear && (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="select select-bordered select-sm pr-8 font-medium"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh */}
          <button
            className="btn btn-ghost btn-sm btn-square"
            onClick={fetchAnalytics}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Export */}
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* ── MAIN METRIC CARDS ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Customer Spend */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 shadow-lg border border-blue-200/50 dark:border-blue-700/30 hover:shadow-xl transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <DollarSign
                  size={24}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <div className="badge badge-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0">
                <Briefcase size={12} className="mr-1" />
                {completedBookings} Satisfied jobs
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">
              Total Customer Spend
            </p>
            <p className="text-2xl xl:text-3xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(completedVolume)}
            </p>
            <p className="text-[11px] opacity-40 mt-1">
              From {completedBookings} completed (non-disputed) bookings
            </p>
          </div>
        </div>

        {/* Total Dispute Refunds */}
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 shadow-lg border border-orange-200/50 dark:border-orange-700/30 hover:shadow-xl transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Undo2
                  size={24}
                  className="text-orange-600 dark:text-orange-400"
                />
              </div>
              {disputeCount > 0 && (
                <div className="badge badge-sm bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-0">
                  <Scale size={12} className="mr-1" />
                  {disputeCount} dispute job{disputeCount !== 1 ? "s" : ""}
                </div>
              )}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">
              Total Dispute Refunds
            </p>
            <p className="text-2xl xl:text-3xl font-bold text-orange-700 dark:text-orange-300">
              {formatCurrency(disputeRefunds)}
            </p>
            <p className="text-[11px] opacity-40 mt-1">
              User's escrowed payment returned after disputes
            </p>
          </div>
        </div>

        {/* Total Admin Commission */}
        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 shadow-lg border border-emerald-200/50 dark:border-emerald-700/30 hover:shadow-xl transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Percent
                  size={24}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <div className="badge badge-sm bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0">
                {(commissionRate * 100).toFixed(0)}% rate
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">
              Total Platform Commission
            </p>
            <p className="text-2xl xl:text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalAdminCommission)}
            </p>
            <p className="text-[11px] opacity-40 mt-1">
              Platform fee from completed &amp; dispute-resolved jobs
            </p>
          </div>
        </div>

        {/* Total Platform Volume */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 shadow-lg border border-purple-200/50 dark:border-purple-700/30 hover:shadow-xl transition-shadow">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <TrendingUp
                  size={24}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
              <div className="badge badge-sm bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-0">
                <ArrowUpRight size={12} className="mr-1" />
                Platform Volume
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">
              Total Platform Volume
            </p>
            <p className="text-2xl xl:text-3xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(totalPlatformVolume)}
            </p>
            <p className="text-[11px] opacity-40 mt-1">
              Total customer payment volume across all transactions
            </p>
          </div>
        </div>
      </div>

      {/* ── MONEY FLOW BREAKDOWN ───────────────────── */}
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2 opacity-70">
            <FileSpreadsheet size={16} />
            Where the Money Goes
          </h3>

          {/* Flow 1: Completed Bookings (always balances) */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-3">
              Completed Bookings — {completedBookings} jobs
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30">
                <DollarSign size={14} className="text-blue-600" />
                <div>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    {formatCurrency(completedVolume)}
                  </span>
                  <span className="text-[10px] opacity-40 ml-1">
                    Customers Paid
                  </span>
                </div>
              </div>
              <span className="font-bold text-lg opacity-40">=</span>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30">
                <Percent size={14} className="text-emerald-600" />
                <div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(completedAdmin)}
                  </span>
                  <span className="text-[10px] opacity-40 ml-1">
                    Admin ({(commissionRate * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              <span className="font-bold text-lg opacity-40">+</span>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-700/30">
                <Wallet size={14} className="text-purple-600" />
                <div>
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    {formatCurrency(completedContractor)}
                  </span>
                  <span className="text-[10px] opacity-40 ml-1">
                    Contractors ({(100 - commissionRate * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>

            {completedCases.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold opacity-60 mb-2">
                  Completed Cases (Specified User & Contractor)
                </p>
                <div className="overflow-x-auto rounded-lg border border-base-200">
                  <table className="table table-xs">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Service</th>
                        <th>User</th>
                        <th>Contractor</th>
                        <th className="text-right">Amount</th>
                        <th className="text-right">Admin</th>
                        <th className="text-right">Contractor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedCases.map((item, idx) => (
                        <tr
                          key={`completed-case-${item.id || item.completedAt || "case"}-${idx}`}
                        >
                          <td>
                            {item.completedAt
                              ? new Date(item.completedAt).toLocaleDateString(
                                  "en-PK",
                                )
                              : "-"}
                          </td>
                          <td>{item.serviceName || "Service"}</td>
                          <td>{item.userName || "Unknown User"}</td>
                          <td>{item.contractorName || "Unknown Contractor"}</td>
                          <td className="text-right font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="text-right text-emerald-600">
                            {formatCurrency(item.admin)}
                          </td>
                          <td className="text-right text-purple-600">
                            {formatCurrency(item.contractor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Flow 2: Disputed Bookings (only if any disputes exist) */}
          {disputeCount > 0 && (
            <div className="pt-4 border-t border-base-200">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-3">
                Disputed Bookings — {disputeCount} dispute
                {disputeCount !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/30">
                  <Scale size={14} className="text-red-600" />
                  <div>
                    <span className="font-semibold text-red-700 dark:text-red-300">
                      {formatCurrency(disputedVolume)}
                    </span>
                    <span className="text-[10px] opacity-40 ml-1">
                      Disputed Amount
                    </span>
                  </div>
                </div>
                <span className="font-bold text-lg opacity-40">=</span>
                {disputeAdmin > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30">
                      <Percent size={14} className="text-emerald-600" />
                      <div>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(disputeAdmin)}
                        </span>
                        <span className="text-[10px] opacity-40 ml-1">
                          Admin
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-lg opacity-40">+</span>
                  </>
                )}
                {disputeContractor > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-700/30">
                      <Wallet size={14} className="text-purple-600" />
                      <div>
                        <span className="font-semibold text-purple-700 dark:text-purple-300">
                          {formatCurrency(disputeContractor)}
                        </span>
                        <span className="text-[10px] opacity-40 ml-1">
                          Contractors
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-lg opacity-40">+</span>
                  </>
                )}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/30">
                  <Undo2 size={14} className="text-orange-600" />
                  <div>
                    <span className="font-semibold text-orange-700 dark:text-orange-300">
                      {formatCurrency(disputeRefunds)}
                    </span>
                    <span className="text-[10px] opacity-40 ml-1">
                      Returned to Users
                    </span>
                  </div>
                </div>
              </div>
              {disputeDecisionRows.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-semibold opacity-60">
                    Decision-wise breakdown (this explains why disputed totals
                    are not always 50/50)
                  </p>
                  {disputeDecisionRows.map((row) => (
                    <div
                      key={row.key}
                      className="rounded-lg border border-base-200 bg-base-200/30 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold">
                          {row.label} — {row.data.count} case
                          {row.data.count !== 1 ? "s" : ""}
                        </span>
                        <span className="opacity-60">{row.rule}</span>
                      </div>
                      <p className="text-xs mt-1 opacity-80">
                        {formatCurrency(row.data.volume)} = Admin{" "}
                        {formatCurrency(row.data.admin)} + Contractor{" "}
                        {formatCurrency(row.data.contractor)} + User{" "}
                        {formatCurrency(row.data.refund)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {disputeCases.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold opacity-60 mb-2">
                    Dispute Cases (Specified User & Contractor)
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-base-200">
                    <table className="table table-xs">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Decision</th>
                          <th>User</th>
                          <th>Contractor</th>
                          <th className="text-right">Amount</th>
                          <th className="text-right">Admin</th>
                          <th className="text-right">Contractor</th>
                          <th className="text-right">User Refund</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disputeCases.map((item, idx) => (
                          <tr
                            key={`${item.id || item.resolvedAt || "case"}-${idx}`}
                          >
                            <td>
                              {item.resolvedAt
                                ? new Date(item.resolvedAt).toLocaleDateString(
                                    "en-PK",
                                  )
                                : "-"}
                            </td>
                            <td>{item.decision || "-"}</td>
                            <td>{item.userName || "Unknown User"}</td>
                            <td>
                              {item.contractorName || "Unknown Contractor"}
                            </td>
                            <td className="text-right font-medium">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="text-right text-emerald-600">
                              {formatCurrency(item.admin)}
                            </td>
                            <td className="text-right text-purple-600">
                              {formatCurrency(item.contractor)}
                            </td>
                            <td className="text-right text-orange-600">
                              {formatCurrency(item.refund)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <p className="text-[11px] opacity-40 mt-3">
                Dispute refunds are the user's own escrowed payment returned —
                NOT paid by admin. Admin earns 0% commission on fully refunded
                disputes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── MONTHLY TREND & TOP SERVICES ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 card bg-base-100 shadow-md border border-base-200">
          <div className="card-body p-5">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              Monthly Revenue Trend
            </h3>
            {trend.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 opacity-40">
                <BarChart3 size={48} />
                <p className="mt-3 text-sm">
                  No completed transactions in this period
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {trend.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-20 text-xs font-medium opacity-60 text-right flex-shrink-0">
                      {m.label}
                    </div>
                    <div className="flex-1 relative">
                      {/* Spend bar (background) */}
                      <div className="h-8 bg-base-200 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400/30 to-blue-500/30 rounded-lg transition-all duration-500"
                          style={{
                            width: `${Math.max((m.spend / maxTrendSpend) * 100, 2)}%`,
                          }}
                        />
                        {/* Commission overlay */}
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-lg absolute top-0 left-0 transition-all duration-500"
                          style={{
                            width: `${Math.max((m.commission / maxTrendSpend) * 100, 1)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-28 text-right flex-shrink-0">
                      <span className="text-xs font-bold text-emerald-600">
                        {formatCurrency(m.commission)}
                      </span>
                      <br />
                      <span className="text-[10px] opacity-40">
                        {m.jobs} job{m.jobs !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-6 pt-3 border-t border-base-200 mt-2">
                  <div className="flex items-center gap-2 text-xs opacity-50">
                    <div className="w-3 h-3 rounded bg-blue-400/40" />
                    Customer Spend
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-50">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    Admin Commission
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-secondary" />
              Top Services
            </h3>
            <p className="text-[11px] opacity-50 -mt-2 mb-3">
              Bar shows relative revenue share (not a timeline)
            </p>
            {topServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 opacity-40">
                <Briefcase size={36} />
                <p className="mt-2 text-xs">No data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topServices.map((s, idx) => {
                  const maxRev = topServices[0]?.revenue || 1;
                  const relativePct =
                    maxRev > 0 ? (s.revenue / maxRev) * 100 : 0;
                  const visibleSharePct =
                    totalTopServicesRevenue > 0
                      ? (s.revenue / totalTopServicesRevenue) * 100
                      : 0;
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium truncate max-w-[160px]">
                          {s.service}
                        </span>
                        <div className="text-right ml-2 flex-shrink-0">
                          <span className="text-xs font-bold text-primary block">
                            {formatCurrency(s.revenue)}
                          </span>
                          <span className="text-[10px] opacity-50 block">
                            {visibleSharePct.toFixed(1)}% share
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
                          style={{ width: `${Math.max(relativePct, 3)}%` }}
                        />
                      </div>
                      <p className="text-[10px] opacity-40 mt-0.5">
                        {s.count} booking{s.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DETAILED SUMMARY TABLE ──────────────────── */}
      <div className="card bg-base-100 shadow-md border border-base-200">
        <div className="card-body p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-info" />
            Period Summary — {filterLabel}
          </h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-base-200/30">
                  <td
                    className="font-bold text-xs uppercase tracking-wider opacity-50"
                    colSpan={3}
                  >
                    Completed Bookings
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Customer Spend</td>
                  <td className="text-right font-bold text-blue-600">
                    {formatCurrency(completedVolume)}
                  </td>
                  <td className="text-right text-xs opacity-50">
                    Total payments from {completedBookings} completed bookings
                  </td>
                </tr>
                <tr>
                  <td className="font-medium pl-6">
                    → Admin Commission ({(commissionRate * 100).toFixed(0)}%)
                  </td>
                  <td className="text-right font-bold text-emerald-600">
                    {formatCurrency(completedAdmin)}
                  </td>
                  <td className="text-right text-xs opacity-50">
                    Platform fee from completed jobs
                  </td>
                </tr>
                <tr>
                  <td className="font-medium pl-6">
                    → Contractor Payouts (
                    {(100 - commissionRate * 100).toFixed(0)}%)
                  </td>
                  <td className="text-right font-bold text-purple-600">
                    {formatCurrency(completedContractor)}
                  </td>
                  <td className="text-right text-xs opacity-50">
                    Sent to contractors from completed jobs
                  </td>
                </tr>

                {disputeCount > 0 && (
                  <>
                    <tr className="bg-base-200/30">
                      <td
                        className="font-bold text-xs uppercase tracking-wider opacity-50"
                        colSpan={3}
                      >
                        Disputed Bookings
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium">Disputed Volume</td>
                      <td className="text-right font-bold text-red-600">
                        {formatCurrency(disputedVolume)}
                      </td>
                      <td className="text-right text-xs opacity-50">
                        Total from {disputeCount} resolved dispute
                        {disputeCount !== 1 ? "s" : ""}
                      </td>
                    </tr>
                    {disputeAdmin > 0 && (
                      <tr>
                        <td className="font-medium pl-6">
                          → Admin (from Release/Split)
                        </td>
                        <td className="text-right font-bold text-emerald-600">
                          {formatCurrency(disputeAdmin)}
                        </td>
                        <td className="text-right text-xs opacity-50">
                          Commission from non-refunded disputes
                        </td>
                      </tr>
                    )}
                    {disputeContractor > 0 && (
                      <tr>
                        <td className="font-medium pl-6">
                          → Contractor (from Release/Split)
                        </td>
                        <td className="text-right font-bold text-purple-600">
                          {formatCurrency(disputeContractor)}
                        </td>
                        <td className="text-right text-xs opacity-50">
                          Contractor earnings from disputes
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="font-medium pl-6">→ Refunded to Users</td>
                      <td className="text-right font-bold text-orange-600">
                        {formatCurrency(disputeRefunds)}
                      </td>
                      <td className="text-right text-xs opacity-50">
                        User's escrowed money returned
                      </td>
                    </tr>
                    {disputeDecisionRows.map((row) => (
                      <tr key={`summary-${row.key}`}>
                        <td className="font-medium pl-6">→ {row.label}</td>
                        <td className="text-right font-bold text-slate-700 dark:text-slate-200">
                          {formatCurrency(row.data.volume)}
                        </td>
                        <td className="text-right text-xs opacity-50">
                          {row.data.count} case{row.data.count !== 1 ? "s" : ""}
                          : Admin {formatCurrency(row.data.admin)} • Contractor{" "}
                          {formatCurrency(row.data.contractor)} • User{" "}
                          {formatCurrency(row.data.refund)}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                <tr className="bg-base-200/30">
                  <td
                    className="font-bold text-xs uppercase tracking-wider opacity-50"
                    colSpan={3}
                  >
                    Totals
                  </td>
                </tr>
                <tr>
                  <td className="font-medium">Total Platform Volume</td>
                  <td className="text-right font-bold">
                    {formatCurrency(totalPlatformVolume)}
                  </td>
                  <td className="text-right text-xs opacity-50">
                    All money that entered escrow
                  </td>
                </tr>
                <tr className="border-t-2 border-base-300">
                  <td className="font-bold text-lg">
                    Total Revenue (Admin Earnings)
                  </td>
                  <td className="text-right font-bold text-lg text-emerald-600">
                    {formatCurrency(totalRevenue)}
                  </td>
                  <td className="text-right text-xs opacity-50">
                    = All admin commission earned
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalytics;
