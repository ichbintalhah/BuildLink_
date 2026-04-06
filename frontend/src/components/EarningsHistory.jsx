import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Star,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Wallet,
  TrendingUp,
  Filter,
} from "lucide-react";
import PageLoader from "./PageLoader";
import ImagePreviewModal from "./ImagePreviewModal";

const formatDate = (dateVal) => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return "N/A";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "N/A";
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

const EarningsHistory = () => {
  const { user } = useContext(AuthContext);
  const isContractor = user?.role === "contractor";
  const [earnings, setEarnings] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // "all", "earnings", "withdrawals"
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchEarningsHistory();
  }, []);

  const fetchEarningsHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get("/bookings/earnings/history");
      const data = response.data;

      setEarnings(data.earnings || []);
      setWithdrawals(data.withdrawals || []);
      setTotalEarnings(data.totalEarnings || 0);
      setTotalWithdrawn(data.totalWithdrawn || 0);
      setPendingWithdrawals(data.pendingWithdrawals || 0);
      setWalletBalance(data.walletBalance || 0);
    } catch (err) {
      console.error("[EarningsHistory] Error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load earnings history";
      setError(errorMsg);
      setEarnings([]);
      setWithdrawals([]);
      setTotalEarnings(0);
      setTotalWithdrawn(0);
      setPendingWithdrawals(0);
      setWalletBalance(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Build combined timeline sorted by date
  const buildTimeline = () => {
    const items = [];

    earnings.forEach((e) => {
      items.push({
        ...e,
        _type: "earning",
        _date: new Date(e.completionDate || 0),
        _amount: e.amountEarned,
      });
    });

    withdrawals.forEach((w) => {
      items.push({
        ...w,
        _type: "withdrawal",
        _date: new Date(w.date || w.createdAt || 0),
        _amount: w.amount,
      });
    });

    // Sort by date descending (newest first)
    items.sort((a, b) => b._date - a._date);
    return items;
  };

  const timeline = buildTimeline();

  const filteredTimeline =
    activeTab === "all"
      ? timeline
      : activeTab === "earnings"
        ? timeline.filter((t) => t._type === "earning")
        : timeline.filter((t) => t._type === "withdrawal");

  // Earning type badge
  const getEarningTypeBadge = (earningType, disputeDecision) => {
    switch (earningType) {
      case "auto_release":
        return (
          <span className="badge badge-primary badge-sm gap-1 font-bold">
            <Clock size={12} /> Auto-Released
          </span>
        );
      case "split":
        return (
          <span className="badge badge-warning badge-sm gap-1 font-bold">
            <AlertTriangle size={12} /> Split Decision
          </span>
        );
      case "release":
        return (
          <span className="badge badge-success badge-sm gap-1 font-bold">
            <CheckCircle size={12} /> Released
          </span>
        );
      case "refund":
        return (
          <span className="badge badge-error badge-sm gap-1 font-bold">
            <XCircle size={12} /> Refund (No Earning)
          </span>
        );
      default:
        return (
          <span className="badge badge-info badge-sm gap-1 font-bold">
            <CheckCircle size={12} /> Completed
          </span>
        );
    }
  };

  // Withdrawal status badge
  const getWithdrawalStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return (
          <span className="badge badge-success font-bold gap-1">
            <CheckCircle size={12} /> Completed
          </span>
        );
      case "Rejected":
        return (
          <span className="badge badge-error font-bold gap-1">
            <XCircle size={12} /> Rejected
          </span>
        );
      case "Pending":
      default:
        return (
          <span className="badge badge-warning font-bold gap-1">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  const getTransactionTypeBadge = (type) => {
    if (type === "earning") {
      return (
        <span className="badge badge-success badge-outline badge-sm font-bold">
          Earning
        </span>
      );
    }

    return (
      <span className="badge badge-error badge-outline badge-sm font-bold">
        Withdrawal
      </span>
    );
  };

  if (isLoading) {
    return (
      <PageLoader isLoading={true} message="Loading earnings history..." />
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 pt-6">
        <div className="alert alert-error">
          <h3 className="font-bold">Failed to load earnings</h3>
          <p className="text-sm">{error}</p>
          <button onClick={fetchEarningsHistory} className="btn btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header with Wallet Balance */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={32} />
              <h1 className="text-3xl font-bold">
                {isContractor
                  ? "Earnings History"
                  : "Wallet & Transaction History"}
              </h1>
            </div>
            <p className="opacity-90">
              {isContractor
                ? "Track all your earnings and withdrawals"
                : "Track your refunds and withdrawals"}
            </p>
          </div>
          {walletBalance > 0 && (
            <Link
              to="/withdrawal-request"
              className="btn btn-lg bg-white text-emerald-700 hover:bg-emerald-50 border-0 shadow-md gap-2 font-bold"
            >
              <Wallet size={20} /> Withdraw Funds
            </Link>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stats shadow border border-base-200 bg-base-100">
          <div className="stat py-4 px-5">
            <div className="stat-figure text-success">
              <TrendingUp size={22} />
            </div>
            <div className="stat-title text-xs">
              {isContractor ? "Total Earned" : "Total Refunded"}
            </div>
            <div className="stat-value text-success text-xl">
              Rs. {totalEarnings.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="stats shadow border border-base-200 bg-base-100">
          <div className="stat py-4 px-5">
            <div className="stat-figure text-primary">
              <Wallet size={22} />
            </div>
            <div className="stat-title text-xs">Current Balance</div>
            <div className="stat-value text-primary text-xl">
              Rs. {walletBalance.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="stats shadow border border-base-200 bg-base-100">
          <div className="stat py-4 px-5">
            <div className="stat-figure text-info">
              <ArrowUpCircle size={22} />
            </div>
            <div className="stat-title text-xs">Total Withdrawn</div>
            <div className="stat-value text-info text-xl">
              Rs. {totalWithdrawn.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="stats shadow border border-base-200 bg-base-100">
          <div className="stat py-4 px-5">
            <div className="stat-figure text-warning">
              <Clock size={22} />
            </div>
            <div className="stat-title text-xs">Pending Withdrawal</div>
            <div className="stat-value text-warning text-xl">
              Rs. {pendingWithdrawals.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-base-100 p-2 rounded-xl shadow border border-base-200">
        {[
          { id: "all", label: "All Transactions", count: timeline.length },
          { id: "earnings", label: "Earnings", count: earnings.length },
          {
            id: "withdrawals",
            label: "Withdrawals",
            count: withdrawals.length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 btn btn-sm gap-2 ${
              activeTab === tab.id ? "btn-primary" : "btn-ghost"
            }`}
          >
            <Filter size={14} />
            {tab.label}
            <span
              className={`badge badge-xs ${activeTab === tab.id ? "badge-secondary" : "badge-primary"}`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Transaction List */}
      {filteredTimeline.length === 0 ? (
        <div className="card bg-base-100 shadow-lg border-l-4 border-warning p-6 text-center">
          <p className="text-base-content/70 mb-4">
            {activeTab === "all"
              ? "No transactions yet. Start accepting jobs to build your earnings history!"
              : activeTab === "earnings"
                ? "No earnings recorded yet."
                : "No withdrawals made yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTimeline.map((item, idx) => (
            <div
              key={`${item._type}-${item._id}-${idx}`}
              className={`card bg-base-100 shadow-md border hover:shadow-lg transition-all duration-200 ${
                item._type === "earning"
                  ? "border-l-4 border-l-success border-base-300"
                  : "border-l-4 border-l-info border-base-300"
              }`}
            >
              <div className="card-body p-5">
                {item._type === "earning" ? (
                  /* ===== EARNING ROW ===== */
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                        <ArrowDownCircle size={24} className="text-success" />
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTransactionTypeBadge("earning")}
                        <h3 className="font-bold text-base-content truncate">
                          {item.jobTitle}
                        </h3>
                        {getEarningTypeBadge(
                          item.earningType,
                          item.disputeDecision,
                        )}
                      </div>
                      <p className="text-sm text-base-content/60 mt-1">
                        {isContractor ? "Client" : "Contractor"}:{" "}
                        {item.clientName}
                      </p>
                      {item.earningType === "split" && (
                        <p className="text-xs text-warning mt-1">
                          Dispute split — Original price: Rs.{" "}
                          {item.totalPrice?.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-xl font-bold ${item.amountEarned > 0 ? "text-success" : "text-base-content/40"}`}
                      >
                        {item.amountEarned > 0 ? "+" : ""}Rs.{" "}
                        {item.amountEarned.toLocaleString()}
                      </p>
                      <p className="text-xs text-base-content/50 mt-1">
                        {formatDate(item.completionDate)}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="flex-shrink-0 text-right md:w-28">
                      {item.rating ? (
                        <div className="flex items-center gap-1 justify-end">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${i < item.rating ? "text-warning" : "text-base-300"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-base-content/40">
                          No rating
                        </span>
                      )}
                      {item.reviewText && (
                        <p
                          className="text-xs text-base-content/60 mt-1 italic truncate max-w-[150px]"
                          title={item.reviewText}
                        >
                          "{item.reviewText}"
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ===== WITHDRAWAL ROW ===== */
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          item.status === "Completed"
                            ? "bg-info/10"
                            : item.status === "Rejected"
                              ? "bg-error/10"
                              : "bg-warning/10"
                        }`}
                      >
                        <ArrowUpCircle
                          size={24}
                          className={
                            item.status === "Completed"
                              ? "text-info"
                              : item.status === "Rejected"
                                ? "text-error"
                                : "text-warning"
                          }
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTransactionTypeBadge("withdrawal")}
                        <h3 className="font-bold text-base-content">
                          Withdrawal Request
                        </h3>
                        {getWithdrawalStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-base-content/60 mt-1">
                        Method:{" "}
                        <span className="font-semibold">{item.method}</span>
                        {item.accountDetails && (
                          <span> • {item.accountDetails}</span>
                        )}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-xl font-bold ${
                          item.status === "Rejected"
                            ? "text-base-content/40 line-through"
                            : "text-error"
                        }`}
                      >
                        -Rs. {item.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-base-content/50 mt-1">
                        {formatDateTime(item.date)}
                      </p>
                    </div>

                    {/* Proof */}
                    <div className="flex-shrink-0 md:w-28 text-right">
                      {item.transactionScreenshot ? (
                        <button
                          onClick={() =>
                            setPreviewImage(item.transactionScreenshot)
                          }
                          className="btn btn-xs btn-ghost gap-1 text-primary"
                        >
                          <Download size={14} /> View Proof
                        </button>
                      ) : (
                        <span className="text-xs text-base-content/40">
                          {item.status === "Pending" ? "Awaiting admin" : "—"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ImagePreviewModal
        imageUrl={previewImage}
        alt="Transaction proof"
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default EarningsHistory;
