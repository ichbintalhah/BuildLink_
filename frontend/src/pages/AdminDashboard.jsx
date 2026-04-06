import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import FinancialAnalytics from "../components/FinancialAnalytics";
import ImagePreviewModal from "../components/ImagePreviewModal";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Scale,
  Sparkles,
  FileText,
  DollarSign,
  Upload,
  X,
  Maximize2,
  Loader2,
  Bot,
  Settings,
  Save,
} from "lucide-react";

const AdminDashboard = ({ externalView = null, notifState = {} }) => {
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [historyTab, setHistoryTab] = useState("payments");
  const [historyLoading, setHistoryLoading] = useState({
    payments: false,
    withdrawals: false,
  });
  const [historyLoaded, setHistoryLoaded] = useState({
    payments: false,
    withdrawals: false,
  });

  const [sectionLoading, setSectionLoading] = useState({
    payments: false,
    withdrawals: false,
    disputes: false,
    users: false,
    contractors: false,
    settings: false,
  });

  const [loadedSections, setLoadedSections] = useState({
    payments: false,
    withdrawals: false,
    disputes: false,
    users: false,
    contractors: false,
    settings: false,
  });

  // Settings State
  const [adminSettings, setAdminSettings] = useState({
    ibanNumber: "",
    bankName: "",
    accountHolderName: "",
    companyName: "BuildLink",
    companyEmail: "",
    companyPhone: "",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [view, setView] = useState("payments");
  const currentView = externalView !== null ? externalView : view;

  // Withdrawal Modal State
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminProof, setAdminProof] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  // ✅ AI SUMMARY STATE - MOVED OUTSIDE TO BE ACCESSIBLE
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // IMAGE PREVIEW STATE
  const [previewImage, setPreviewImage] = useState(null);

  const getPaymentStatusClass = (status) => {
    const value = (status || "").toLowerCase();
    if (["completed", "approved", "released"].includes(value)) {
      return "text-success font-semibold";
    }
    if (["disputed", "refunded", "rejected"].includes(value)) {
      return "text-error font-semibold";
    }
    if (["processing", "held", "pending"].includes(value)) {
      return "text-warning font-semibold";
    }
    return "text-info font-semibold";
  };

  const getBookingStatusClass = (status) => {
    const value = (status || "").toLowerCase();
    if (
      ["completed", "payment_released", "approved", "auto_completed"].includes(
        value,
      )
    ) {
      return "text-success font-semibold";
    }
    if (["cancelled", "rejected_payment", "dispute_lost"].includes(value)) {
      return "text-error font-semibold";
    }
    if (["in_progress", "verification_pending", "pending"].includes(value)) {
      return "text-warning font-semibold";
    }
    return "text-info font-semibold";
  };

  const getWithdrawalMethodClass = (method) => {
    const value = (method || "").toLowerCase();
    if (value.includes("bank")) return "text-primary font-semibold";
    if (value.includes("easypaisa") || value.includes("jazzcash")) {
      return "text-secondary font-semibold";
    }
    return "text-info font-semibold";
  };

  const getWithdrawalCategory = (withdrawal) => {
    const userModel = (withdrawal?.userModel || "").toLowerCase();
    const accountText = (withdrawal?.accountDetails || "").toLowerCase();

    if (userModel === "user") {
      return { label: "User", className: "badge badge-info" };
    }

    if (userModel === "contractor") {
      const isHeavyDuty =
        accountText.includes("heavy") ||
        accountText.includes("heavy-duty") ||
        accountText.includes("construction");
      if (isHeavyDuty) {
        return {
          label: "Heavy Duty Contractor",
          className: "badge badge-warning",
        };
      }

      return {
        label: "Normal Contractor",
        className: "badge badge-primary",
      };
    }

    return { label: "Unknown", className: "badge badge-ghost" };
  };

  // --- OPTIMIZED DATA FETCHING ---

  const fetchSectionData = async (section) => {
    if (loadedSections[section]) return;

    setSectionLoading((prev) => ({ ...prev, [section]: true }));

    try {
      let res;
      switch (section) {
        case "payments":
          res = await api.get("/bookings/admin/all?limit=50");
          const bookingData = res.data;
          setBookings(
            Array.isArray(bookingData)
              ? bookingData
              : bookingData.bookings || [],
          );
          break;
        case "withdrawals":
          res = await api.get("/wallet/admin/requests");
          setWithdrawals(res.data || []);
          break;
        case "disputes":
          res = await api.get("/disputes");
          setDisputes(res.data || []);
          break;
        case "users":
          res = await api.get("/users/admin/users?limit=50");
          setUsers(res.data || []);
          break;
        case "contractors":
          res = await api.get("/users/admin/contractors?limit=50");
          setContractors(res.data || []);
          break;
        case "settings":
          res = await api.get("/dashboard/admin/settings");
          setAdminSettings(res.data || {});
          break;
        default:
          break;
      }
      setLoadedSections((prev) => ({ ...prev, [section]: true }));
    } catch (error) {
      console.error(error);
      toast.error(`Failed to load ${section}`);
    } finally {
      setSectionLoading((prev) => ({ ...prev, [section]: false }));
    }
  };

  const fetchHistoryData = async (type) => {
    if (historyLoaded[type]) return;

    setHistoryLoading((prev) => ({ ...prev, [type]: true }));

    try {
      if (type === "payments") {
        const { data } = await api.get("/payments/admin/history");
        setPaymentHistory(data || []);
      }

      if (type === "withdrawals") {
        const { data } = await api.get("/wallet/admin/history");
        setWithdrawalHistory(data || []);
      }

      setHistoryLoaded((prev) => ({ ...prev, [type]: true }));
    } catch (error) {
      console.error(error);
      toast.error(`Failed to load ${type} history`);
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  useEffect(() => {
    let sectionToFetch = currentView;
    if (currentView === "bookings") sectionToFetch = "payments";
    fetchSectionData(sectionToFetch);
  }, [currentView]);

  useEffect(() => {
    if (currentView !== "finance-history") return;
    fetchHistoryData(historyTab);
  }, [currentView, historyTab]);

  // Handle notification navigation - scroll to relevant card after data loads
  const [lastProcessedNotif, setLastProcessedNotif] = useState(null);

  useEffect(() => {
    if (!notifState.fromNotification) return;
    // Prevent re-processing the same notification
    if (lastProcessedNotif === notifState.timestamp) return;

    const targetId = notifState.bookingId;
    // If no ID to scroll to, just mark as processed (tab switch is handled by Dashboard.jsx)
    if (!targetId) {
      setLastProcessedNotif(notifState.timestamp);
      return;
    }

    // Determine which section must be loaded before we can find the card
    const category = notifState.notifCategory || "general";
    let sectionKey = "payments";
    if (category.startsWith("withdrawal")) sectionKey = "withdrawals";
    else if (category.startsWith("dispute")) sectionKey = "disputes";
    else if (
      [
        "booking_request",
        "booking_accepted",
        "booking_rejected",
        "job_completion",
        "milestone_completion",
        "auto_complete",
      ].includes(category)
    )
      sectionKey = "payments";

    // Wait for data to be loaded
    if (!loadedSections[sectionKey]) return;

    // Mark as processed so we don't re-scroll
    setLastProcessedNotif(notifState.timestamp);

    // Scroll to the card after DOM settles
    const scrollTimeout = setTimeout(() => {
      const el = document.getElementById(`admin-card-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 3000);
      }
    }, 600);

    return () => clearTimeout(scrollTimeout);
  }, [
    notifState,
    loadedSections,
    lastProcessedNotif,
    bookings,
    withdrawals,
    disputes,
  ]);

  // --- ACTIONS ---

  const handleContractorToggle = async (contractorId, field, value) => {
    try {
      await api.put(`/contractors/admin/${contractorId}`, { [field]: value });
      toast.success(`Contractor ${field} updated successfully`);
      setContractors((prev) =>
        prev.map((c) =>
          c._id === contractorId ? { ...c, [field]: value } : c,
        ),
      );
    } catch (error) {
      console.error(error);
      toast.error(`Failed to update contractor ${field}`);
    }
  };

  const handleVerifyPayment = async (bookingId, decision) => {
    const comment =
      decision === "reject" ? prompt("Reason for rejection:") : "";
    if (decision === "reject" && !comment) return;

    try {
      await api.put(`/payments/${bookingId}/verify`, { decision, comment });
      toast.success(`Payment ${decision}ed successfully`);
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  const handleProcessWithdrawal = async () => {
    if (!adminProof) return toast.error("Please upload payment screenshot");

    try {
      await api.put(`/wallet/admin/${selectedWithdrawal._id}`, {
        status: "Completed",
        transactionScreenshot: adminProof,
      });
      toast.success("Withdrawal Completed & Sent!");
      setSelectedWithdrawal(null);
      setAdminProof(null);
      setWithdrawals((prev) =>
        prev.filter((w) => w._id !== selectedWithdrawal._id),
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to process withdrawal",
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAdminProof(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleResolveDispute = async (disputeId, decision) => {
    const comment = prompt(`Enter admin comment for ${decision} decision:`);
    if (!comment) return;

    try {
      await api.put(`/disputes/${disputeId}/resolve`, { decision, comment });
      toast.success(`Dispute resolved: ${decision}`);
      setLoadedSections((prev) => ({ ...prev, disputes: false }));
      fetchSectionData("disputes");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resolve dispute");
    }
  };

  // ✅ FIXED: AI SUMMARIZE HANDLER WITH BETTER ERROR HANDLING
  const handleSummarizeDispute = async (dispute) => {
    console.log("🤖 Requesting AI Summary for dispute:", dispute._id);

    setSummaryLoading(true);
    setAiSummary(null);
    setShowSummaryModal(true);

    try {
      const { data } = await api.post(`/disputes/${dispute._id}/summarize`);
      console.log("✅ AI Response received:", data);

      // Handle both possible response structures
      const summary = data.analysis || data.summary || "No analysis available";
      setAiSummary(summary);
    } catch (error) {
      console.error("❌ AI Analysis Error:", error);
      console.error("Error details:", error.response?.data);

      const errorMsg = error.response?.data?.message || "AI Analysis Failed";
      toast.error(errorMsg);
      setShowSummaryModal(false);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async () => {
    if (!adminSettings.ibanNumber) {
      return toast.error("IBAN number is required");
    }

    setIsSavingSettings(true);
    try {
      await api.put("/dashboard/admin/settings", adminSettings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // --- RENDER HELPERS ---

  const TabLoader = () => (
    <div className="flex justify-center py-20 opacity-50">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  const pendingPayments = bookings.filter(
    (b) => b.status === "Verification_Pending",
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Admin Control</h1>
        <p className="text-sm opacity-60 mt-1">
          Manage payments, withdrawals, disputes, and users
        </p>
      </div>

      {/* --- VIEW: PAYMENTS --- */}
      {currentView === "payments" && (
        <div className="grid gap-4">
          {sectionLoading.payments ? (
            <TabLoader />
          ) : (
            <>
              {pendingPayments.length === 0 ? (
                <div className="text-center opacity-50 py-10">
                  No pending payments.
                </div>
              ) : (
                pendingPayments.map((b) => {
                  // Get the correct payment screenshot for heavy duty construction
                  const isHeavyDuty =
                    b.bookingType === "heavy-duty-construction" &&
                    b.paymentSchedule &&
                    b.paymentSchedule.length > 0;
                  const currentMilestoneIndex = b.currentMilestone || 0;
                  const currentMilestone = isHeavyDuty
                    ? b.paymentSchedule[currentMilestoneIndex]
                    : null;
                  const paymentScreenshot =
                    isHeavyDuty && currentMilestone?.paymentScreenshot
                      ? currentMilestone.paymentScreenshot
                      : b.paymentScreenshot;
                  const paymentLabel = isHeavyDuty
                    ? `Milestone ${currentMilestoneIndex + 1}/${b.paymentSchedule.length}`
                    : "Full Payment";
                  const paymentAmount =
                    isHeavyDuty && currentMilestone?.amount
                      ? currentMilestone.amount
                      : b.totalPrice;

                  return (
                    <div
                      key={b._id}
                      id={`admin-card-${b._id}`}
                      className="card bg-base-100 shadow border p-6 flex-row gap-6"
                    >
                      <div
                        className="relative w-32 h-32 cursor-pointer group"
                        onClick={() => setPreviewImage(paymentScreenshot)}
                      >
                        <img
                          src={paymentScreenshot}
                          loading="lazy"
                          className="w-full h-full object-cover rounded-lg bg-base-200 border border-base-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Maximize2 className="text-white" size={24} />
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{b.serviceName}</h3>
                        {isHeavyDuty && (
                          <span className="badge badge-warning badge-sm mt-1">
                            {paymentLabel}
                          </span>
                        )}
                        <p className="opacity-70">
                          User: {b.user?.fullName || "Unknown User"} → Pro:{" "}
                          {b.contractor?.fullName || "Unknown Contractor"}
                        </p>
                        <p className="font-bold text-primary mt-2">
                          Amount: Rs. {paymentAmount.toLocaleString()}
                        </p>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() =>
                              handleVerifyPayment(b._id, "approve")
                            }
                            className="btn btn-success btn-sm md:btn-md font-semibold hover:btn-success hover:shadow-lg transition-all duration-200 gap-2"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(b._id, "reject")}
                            className="btn btn-error btn-sm md:btn-md font-semibold hover:btn-error hover:shadow-lg transition-all duration-200 gap-2"
                          >
                            <X size={16} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      )}

      {/* --- VIEW: WITHDRAWALS --- */}
      {currentView === "withdrawals" && (
        <div className="space-y-4">
          {sectionLoading.withdrawals ? (
            <TabLoader />
          ) : (
            <>
              {withdrawals.length === 0 ? (
                <div className="text-center py-10 bg-base-100 rounded-xl border border-base-200">
                  <p className="opacity-60 text-lg">
                    No withdrawal requests pending
                  </p>
                </div>
              ) : (
                withdrawals.map((w) => (
                  <div
                    key={w._id}
                    id={`admin-card-${w._id}`}
                    className="bg-base-100 rounded-xl shadow border border-base-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-primary">
                            {w.user?.fullName || "Unknown Contractor"}
                          </h3>
                          <p className="text-sm opacity-60">{w.user?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-success">
                            Rs. {w.amount.toLocaleString()}
                          </p>
                          <p className="text-xs opacity-60 mt-1">
                            {new Date(w.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-base-200 rounded-lg p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs opacity-60 font-bold">
                            PAYMENT METHOD
                          </p>
                          <p className="font-bold text-primary">{w.method}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-60 font-bold">
                            ACCOUNT NUMBER
                          </p>
                          <p className="font-mono font-bold">
                            {w.accountDetails}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm opacity-60">Status:</span>
                        <span
                          className={`badge badge-lg ${
                            w.status === "Completed"
                              ? "badge-success"
                              : w.status === "Rejected"
                                ? "badge-error"
                                : "badge-warning"
                          }`}
                        >
                          {w.status}
                        </span>
                      </div>

                      {w.transactionScreenshot && (
                        <div>
                          <p className="text-sm opacity-60 font-bold mb-2">
                            PROOF OF PAYMENT
                          </p>
                          <img
                            src={w.transactionScreenshot}
                            loading="lazy"
                            alt="Payment Proof"
                            className="max-h-48 rounded-lg border border-base-300 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              setPreviewImage(w.transactionScreenshot)
                            }
                          />
                        </div>
                      )}

                      {w.status === "Pending" && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setShowPayModal(true);
                              setShowProofModal(false);
                            }}
                            className="btn btn-primary flex-1 gap-2"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setShowProofModal(true);
                              setShowPayModal(false);
                              setAdminProof(null);
                            }}
                            className="btn btn-success flex-1 gap-2"
                          >
                            Submit Proof
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* --- VIEW: FINANCE HISTORY --- */}
      {currentView === "finance-history" && (
        <div className="space-y-5">
          <div className="bg-base-100/90 border border-base-300 rounded-2xl p-2 flex gap-2 w-full sm:w-fit shadow-sm">
            <button
              onClick={() => setHistoryTab("payments")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex-1 sm:flex-none ${
                historyTab === "payments"
                  ? "bg-primary text-primary-content shadow-md"
                  : "bg-base-100 text-base-content/70 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setHistoryTab("withdrawals")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 flex-1 sm:flex-none ${
                historyTab === "withdrawals"
                  ? "bg-primary text-primary-content shadow-md"
                  : "bg-base-100 text-base-content/70 hover:bg-base-200 hover:text-base-content"
              }`}
            >
              Withdrawals
            </button>
          </div>

          {historyTab === "payments" && (
            <div className="space-y-3">
              {historyLoading.payments ? (
                <TabLoader />
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-10 bg-base-100 rounded-xl border border-base-200">
                  <p className="opacity-60 text-lg">No payment history found</p>
                </div>
              ) : (
                <>
                  <div className="bg-base-100 border border-base-200 rounded-xl px-4 py-3">
                    <p className="text-sm md:text-base font-semibold text-base-content/80">
                      Total Payments:{" "}
                      <span className="text-primary">
                        {paymentHistory.length}
                      </span>
                    </p>
                  </div>

                  {paymentHistory.map((p) => (
                    <div
                      key={p._id}
                      className="bg-base-100 rounded-xl shadow border border-base-200 p-4 md:p-5"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg truncate">
                              {p.serviceName}
                            </h3>
                            {p.bookingType === "heavy-duty-construction" && (
                              <span className="badge badge-warning">
                                Heavy Duty
                              </span>
                            )}
                          </div>
                          <p className="text-base md:text-lg font-semibold mt-1 text-base-content">
                            {p.user?.fullName || "Unknown"} to{" "}
                            {p.contractor?.fullName || "Unknown"}
                          </p>
                          <p className="text-sm md:text-base font-medium opacity-75 mt-1">
                            Decision Date:{" "}
                            {new Date(p.decisionAt).toLocaleString()}
                          </p>
                          {p.milestoneNumber && (
                            <p className="text-xs opacity-60 mt-1">
                              Milestone {p.milestoneNumber}/
                              {p.milestoneTotal || "?"}
                            </p>
                          )}
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xl md:text-2xl font-bold text-primary">
                            Rs. {(p.amount || 0).toLocaleString()}
                          </p>
                          <span
                            className={`badge mt-2 ${
                              p.decision === "Approved"
                                ? "badge-success"
                                : p.decision === "Rejected"
                                  ? "badge-error"
                                  : "badge-warning"
                            }`}
                          >
                            {p.decision}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <p>
                          <span className="opacity-70">Booking Status: </span>
                          <span
                            className={getBookingStatusClass(p.bookingStatus)}
                          >
                            {p.bookingStatus || "-"}
                          </span>
                        </p>
                        <p>
                          <span className="opacity-70">Payment Status: </span>
                          <span
                            className={getPaymentStatusClass(p.paymentStatus)}
                          >
                            {p.paymentStatus || "-"}
                          </span>
                        </p>
                      </div>

                      {p.comment && (
                        <div className="mt-3 p-3 rounded-lg bg-base-200 border border-base-300">
                          <p className="text-sm">
                            <span className="font-semibold">Comment:</span>{" "}
                            {p.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {historyTab === "withdrawals" && (
            <div className="space-y-3">
              {historyLoading.withdrawals ? (
                <TabLoader />
              ) : withdrawalHistory.length === 0 ? (
                <div className="text-center py-10 bg-base-100 rounded-xl border border-base-200">
                  <p className="opacity-60 text-lg">
                    No withdrawal history found
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-base-100 border border-base-200 rounded-xl px-4 py-3">
                    <p className="text-sm md:text-base font-semibold text-base-content/80">
                      Total Withdrawals:{" "}
                      <span className="text-primary">
                        {withdrawalHistory.length}
                      </span>
                    </p>
                  </div>

                  {withdrawalHistory.map((w) => {
                    const category = getWithdrawalCategory(w);
                    return (
                      <div
                        key={w._id}
                        className="bg-base-100 rounded-xl shadow border border-base-200 p-4 md:p-5"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-lg md:text-xl">
                                {w.requester?.fullName || "Unknown"}
                              </h3>
                              <span className={category.className}>
                                {category.label}
                              </span>
                            </div>
                            <p className="text-sm opacity-70">
                              {w.requester?.email || "-"}
                            </p>
                            <p className="text-sm md:text-base font-medium opacity-75 mt-1">
                              Requested:{" "}
                              {new Date(w.requestedAt).toLocaleString()}
                            </p>
                            {w.processedAt && (
                              <p className="text-xs opacity-60 mt-1">
                                Processed:{" "}
                                {new Date(w.processedAt).toLocaleString()}
                              </p>
                            )}
                          </div>

                          <div className="text-left md:text-right">
                            <p className="text-xl md:text-2xl font-bold text-success">
                              Rs. {(w.amount || 0).toLocaleString()}
                            </p>
                            <span
                              className={`badge mt-2 ${
                                w.status === "Completed"
                                  ? "badge-success"
                                  : w.status === "Rejected"
                                    ? "badge-error"
                                    : "badge-warning"
                              }`}
                            >
                              {w.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <p>
                            <span className="opacity-70">Method: </span>
                            <span
                              className={getWithdrawalMethodClass(w.method)}
                            >
                              {w.method || "-"}
                            </span>
                          </p>
                          <p className="break-all">
                            <span className="opacity-70">Account: </span>
                            <span className="text-accent font-medium">
                              {w.accountDetails || "-"}
                            </span>
                          </p>
                        </div>

                        {w.adminComment && (
                          <div className="mt-3 p-3 rounded-lg bg-base-200 border border-base-300">
                            <p className="text-sm">
                              <span className="font-semibold">
                                Admin Comment:
                              </span>{" "}
                              {w.adminComment}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- VIEW: DISPUTES --- */}
      {currentView === "disputes" && (
        <div className="grid gap-4">
          {sectionLoading.disputes ? (
            <TabLoader />
          ) : (
            <>
              {disputes.length === 0 && (
                <div className="text-center opacity-50 py-10">
                  No active disputes.
                </div>
              )}
              {disputes.map((d) => (
                <div
                  key={d._id}
                  id={`admin-card-${d.booking?._id || d._id}`}
                  className="card bg-base-100 shadow-lg border-l-4 border-error"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="card-title text-error flex items-center gap-2">
                          <AlertTriangle size={20} />
                          Dispute Case
                        </h3>
                        <p className="text-sm font-semibold mt-1">
                          Job Title:{" "}
                          {d.booking?.serviceName ||
                            d.booking?.description ||
                            "Unknown Job"}
                        </p>
                        <p className="text-sm opacity-60 mt-1">
                          ID: {d._id.slice(-8)} | Amount: Rs.{" "}
                          {d.booking?.totalPrice || 0}
                        </p>
                      </div>
                      {/* ✅ FIXED: Badge + AI Button Container */}
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className={`badge ${
                            d.status === "Resolved"
                              ? "badge-success"
                              : "badge-warning"
                          } font-bold`}
                        >
                          {d.status}
                        </div>

                        {/* ✅ AI BUTTON - Now properly accessible */}
                        <button
                          onClick={() => handleSummarizeDispute(d)}
                          className="btn btn-xs md:btn-sm btn-outline btn-info gap-1"
                        >
                          <Sparkles size={14} /> AI Summary
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* User Side */}
                      <div className="bg-error/5 p-4 rounded-lg border border-error/20">
                        <h4 className="font-bold text-sm flex items-center gap-2 mb-3">
                          <span className="text-error">👤</span> Homeowner Claim
                        </h4>
                        <div className="flex items-center gap-3 mb-3">
                          {d.user?.profilePicture ||
                          d.booking?.user?.profilePicture ? (
                            <img
                              src={
                                d.user?.profilePicture ||
                                d.booking?.user?.profilePicture
                              }
                              alt="User"
                              className="h-10 w-10 rounded-full object-cover border-2 border-error/30"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-error/20 flex items-center justify-center border-2 border-error/30 text-error text-lg">
                              👤
                            </div>
                          )}
                          <span className="font-semibold text-base-content">
                            {d.user?.fullName ||
                              d.booking?.user?.fullName ||
                              "Homeowner"}
                          </span>
                        </div>
                        {d.createdAt && (
                          <p className="text-xs opacity-50 mb-2">
                            🕐 Submitted:{" "}
                            {new Date(d.createdAt).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        )}
                        <p className="text-sm mb-3 italic">"{d.reason}"</p>
                        {d.userEvidence && d.userEvidence.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {d.userEvidence.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setPreviewImage(img)}
                                className="w-16 h-16 rounded border border-base-300 overflow-hidden"
                              >
                                <img
                                  src={img}
                                  className="w-full h-full object-cover"
                                  alt="Evidence"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Contractor Side */}
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                        <h4 className="font-bold text-sm flex items-center gap-2 mb-3">
                          <span className="text-primary">🔧</span> Contractor
                          Defense
                        </h4>
                        <div className="flex items-center gap-3 mb-3">
                          {d.contractor?.profilePicture ||
                          d.booking?.contractor?.profilePicture ? (
                            <img
                              src={
                                d.contractor?.profilePicture ||
                                d.booking?.contractor?.profilePicture
                              }
                              alt="Contractor"
                              className="h-10 w-10 rounded-full object-cover border-2 border-primary/30"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 text-primary text-lg">
                              🔧
                            </div>
                          )}
                          <span className="font-semibold text-base-content">
                            {d.contractor?.fullName ||
                              d.booking?.contractor?.fullName ||
                              "Professional"}
                          </span>
                        </div>
                        {d.contractorDefenseAt && (
                          <p className="text-xs opacity-50 mb-2">
                            🕐 Submitted:{" "}
                            {new Date(d.contractorDefenseAt).toLocaleString(
                              "en-US",
                              { dateStyle: "medium", timeStyle: "short" },
                            )}
                          </p>
                        )}
                        <p className="text-sm mb-3 italic">
                          {d.contractorDefense || "No defense submitted yet"}
                        </p>
                        {d.contractorEvidence &&
                          d.contractorEvidence.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {d.contractorEvidence.map((img, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setPreviewImage(img)}
                                  className="w-16 h-16 rounded border border-base-300 overflow-hidden"
                                >
                                  <img
                                    src={img}
                                    className="w-full h-full object-cover"
                                    alt="Defense Evidence"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {d.status === "Open" && (
                      <div className="flex gap-3 mt-6 pt-4 border-t border-base-200">
                        <button
                          onClick={() => handleResolveDispute(d._id, "Release")}
                          className="btn btn-sm btn-success flex-1"
                        >
                          <CheckCircle size={16} />
                          Release to Contractor
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d._id, "Refund")}
                          className="btn btn-sm btn-error flex-1"
                        >
                          <AlertTriangle size={16} />
                          Refund User
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d._id, "Split")}
                          className="btn btn-sm btn-warning flex-1"
                        >
                          <Scale size={16} />
                          Split 50/50
                        </button>
                      </div>
                    )}

                    {d.status === "Resolved" && d.adminDecision && (
                      <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/30">
                        <p className="text-sm font-bold text-success">
                          ✅ Resolved: {d.adminDecision}
                        </p>
                        {d.adminComment && (
                          <p className="text-xs opacity-70 mt-1">
                            Admin Note: {d.adminComment}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* --- VIEW: BOOKINGS --- */}
      {currentView === "bookings" && (
        <div>
          {sectionLoading.payments ? (
            <TabLoader />
          ) : (
            <>
              {bookings.length === 0 ? (
                <div className="bg-base-100 p-8 rounded-xl shadow border border-base-200 text-center">
                  <p className="opacity-60 text-lg">No bookings found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      id={`admin-card-${booking._id}`}
                      className="bg-base-100 rounded-lg shadow border border-base-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b border-base-200">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-bold text-base">
                              {booking.serviceName}
                            </h3>
                            {booking.bookingType ===
                              "heavy-duty-construction" && (
                              <span className="badge badge-sm badge-warning mt-1">
                                🏗️ Heavy Duty Construction
                              </span>
                            )}
                            <p className="text-xs opacity-60 mt-1">
                              {booking._id?.slice(-6)}
                            </p>
                          </div>
                          <span
                            className={`badge badge-sm ${
                              booking.status === "completed"
                                ? "badge-success"
                                : booking.status === "active"
                                  ? "badge-info"
                                  : booking.status === "disputed"
                                    ? "badge-error"
                                    : "badge-warning"
                            }`}
                          >
                            {booking.status?.charAt(0).toUpperCase() +
                              booking.status?.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-primary mt-1">📅</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              Start Date
                            </p>
                            <p className="text-sm font-semibold">
                              {booking.scheduledDate
                                ? new Date(
                                    booking.scheduledDate,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-secondary mt-1">📆</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              End Date
                            </p>
                            <p className="text-sm font-semibold">
                              {booking.endDate
                                ? new Date(booking.endDate).toLocaleDateString()
                                : booking.bookingType ===
                                    "heavy-duty-construction"
                                  ? "Multi-milestone"
                                  : "Same day"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-accent mt-1">⏳</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              Duration
                            </p>
                            <p className="text-sm font-semibold">
                              {booking.bookingType === "heavy-duty-construction"
                                ? `${booking.paymentSchedule?.length || 0} milestones`
                                : booking.bookingDays > 1
                                  ? `${booking.bookingDays} days`
                                  : booking.bookingHours
                                    ? `${booking.bookingHours} hours`
                                    : "1 day"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-info mt-1">⏱️</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              Time
                            </p>
                            <p className="text-sm font-semibold">
                              {booking.bookingType === "heavy-duty-construction"
                                ? `${booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"} - ${booking.endDate ? new Date(booking.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}`
                                : `${
                                    booking.booking_start_time
                                      ? (() => {
                                          const [h, m] =
                                            booking.booking_start_time
                                              .split(":")
                                              .map(Number);
                                          const period = h >= 12 ? "PM" : "AM";
                                          const hour12 = h % 12 || 12;
                                          return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
                                        })()
                                      : "N/A"
                                  }${booking.booking_end_time ? ` - ${new Date(booking.booking_end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-success mt-1">👤</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              Client
                            </p>
                            <p className="text-sm font-semibold">
                              {booking.user?.fullName || "Unknown"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-warning mt-1">🔧</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              Contractor
                            </p>
                            <p className="text-sm font-semibold">
                              {booking.contractor?.fullName || "Unknown"}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-base-200">
                          <p className="text-xs opacity-60 font-medium mb-1">
                            Total Amount
                          </p>
                          <p className="text-lg font-bold text-primary">
                            Rs. {booking.totalPrice || 0}
                          </p>
                        </div>
                      </div>

                      <div className="bg-base-200/30 px-4 py-3 text-xs opacity-60 text-center border-t border-base-200">
                        Payment:{" "}
                        {(() => {
                          const isHeavyDuty =
                            booking.bookingType === "heavy-duty-construction" &&
                            booking.paymentSchedule &&
                            booking.paymentSchedule.length > 0;
                          if (isHeavyDuty) {
                            const paidCount = booking.paymentSchedule.filter(
                              (m) => m.status === "paid",
                            ).length;
                            return `${paidCount}/${booking.paymentSchedule.length} milestones paid`;
                          }
                          return booking.paymentScreenshot
                            ? "✓ Verified"
                            : "⊗ Pending";
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* --- VIEW: USERS --- */}
      {currentView === "users" && (
        <div>
          {sectionLoading.users ? (
            <TabLoader />
          ) : (
            <>
              {users.length === 0 ? (
                <div className="bg-base-100 p-8 rounded-xl shadow border border-base-200 text-center">
                  <p className="opacity-60 text-lg">No users found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="bg-base-100 rounded-lg shadow border border-base-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 border-b border-base-200">
                        <div className="flex items-center gap-3">
                          <div
                            className="avatar cursor-pointer"
                            onClick={() =>
                              user.profilePicture &&
                              setPreviewImage(user.profilePicture)
                            }
                          >
                            <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-2 hover:ring-offset-4 transition-all">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.fullName}
                                />
                              ) : (
                                <div className="bg-gradient-to-br from-primary to-secondary w-full h-full flex items-center justify-center text-white font-bold">
                                  {user.fullName?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-base">
                              {user.fullName}
                            </h3>
                            <p className="text-xs opacity-60">👤 Homeowner</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-primary mt-1">📧</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs opacity-60 font-medium">
                              Email
                            </p>
                            <p
                              className="text-sm font-semibold truncate"
                              title={user.email}
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-success mt-1">📱</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              Phone
                            </p>
                            <p className="text-sm font-semibold">
                              {user.phone || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-warning mt-1">🆔</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              CNIC
                            </p>
                            <p className="text-sm font-semibold">
                              {user.cnic || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-base-200">
                          <p className="text-xs opacity-60 font-medium mb-1">
                            Member Since
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Verification Photos Section */}
                        <div className="pt-3 border-t border-base-200">
                          <p className="text-xs opacity-60 font-medium mb-2">
                            Verification Photos
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              className="btn btn-xs btn-outline btn-primary"
                              onClick={() =>
                                user.selfie
                                  ? setPreviewImage(user.selfie)
                                  : toast.error("No selfie uploaded")
                              }
                              disabled={!user.selfie}
                            >
                              🤳 Selfie
                            </button>
                            <button
                              className="btn btn-xs btn-outline btn-secondary"
                              onClick={() =>
                                user.cnicFront
                                  ? setPreviewImage(user.cnicFront)
                                  : toast.error("No CNIC front uploaded")
                              }
                              disabled={!user.cnicFront}
                            >
                              🪪 CNIC Front
                            </button>
                            <button
                              className="btn btn-xs btn-outline btn-accent"
                              onClick={() =>
                                user.cnicBack
                                  ? setPreviewImage(user.cnicBack)
                                  : toast.error("No CNIC back uploaded")
                              }
                              disabled={!user.cnicBack}
                            >
                              🪪 CNIC Back
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* --- VIEW: CONTRACTORS --- */}
      {currentView === "contractors" && (
        <div>
          {sectionLoading.contractors ? (
            <TabLoader />
          ) : (
            <>
              {contractors.length === 0 ? (
                <div className="bg-base-100 p-8 rounded-xl shadow border border-base-200 text-center">
                  <p className="opacity-60 text-lg">No contractors found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contractors.map((contractor) => (
                    <div
                      key={contractor._id}
                      className="bg-base-100 rounded-lg shadow border border-base-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 p-4 border-b border-base-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className="avatar relative cursor-pointer"
                              onClick={() =>
                                contractor.profilePicture &&
                                setPreviewImage(contractor.profilePicture)
                              }
                            >
                              <div className="w-12 h-12 rounded-full ring ring-warning ring-offset-2 hover:ring-offset-4 transition-all">
                                {contractor.profilePicture ? (
                                  <img
                                    src={contractor.profilePicture}
                                    alt={contractor.fullName}
                                  />
                                ) : (
                                  <div className="bg-gradient-to-br from-warning to-error w-full h-full flex items-center justify-center text-white font-bold">
                                    {contractor.fullName
                                      ?.charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}
                              </div>
                              {contractor.isTrusted && (
                                <div className="absolute -top-1 -right-1 bg-success rounded-full p-1">
                                  <ShieldCheck
                                    size={12}
                                    className="text-white"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base">
                                  {contractor.fullName}
                                </h3>
                                {contractor.isTrusted && (
                                  <span className="badge badge-success badge-xs">
                                    Trusted
                                  </span>
                                )}
                              </div>
                              <p className="text-xs opacity-60">
                                🔧 Contractor
                              </p>
                            </div>
                          </div>
                          <span
                            className={`badge badge-sm ${
                              contractor.availability === "Green"
                                ? "badge-success"
                                : contractor.availability === "Yellow"
                                  ? "badge-warning"
                                  : "badge-error"
                            }`}
                          >
                            {contractor.availability || "Unknown"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-warning mt-1">⚙️</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              Primary Skill
                            </p>
                            <p className="text-sm font-semibold">
                              {contractor.skill || "Not specified"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-primary mt-1">📧</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs opacity-60 font-medium">
                              Email
                            </p>
                            <p
                              className="text-sm font-semibold truncate"
                              title={contractor.email}
                            >
                              {contractor.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-success mt-1">📱</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              Phone
                            </p>
                            <p className="text-sm font-semibold">
                              {contractor.phone || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-base-200">
                          <p className="text-xs opacity-60 font-medium mb-1">
                            Member Since
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            {new Date(
                              contractor.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Verification Photos Section */}
                        <div className="pt-3 border-t border-base-200">
                          <p className="text-xs opacity-60 font-medium mb-2">
                            Verification Photos
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              className="btn btn-xs btn-outline btn-primary"
                              onClick={() =>
                                contractor.selfie
                                  ? setPreviewImage(contractor.selfie)
                                  : toast.error("No selfie uploaded")
                              }
                              disabled={!contractor.selfie}
                            >
                              🤳 Selfie
                            </button>
                            <button
                              className="btn btn-xs btn-outline btn-secondary"
                              onClick={() =>
                                contractor.cnicFront
                                  ? setPreviewImage(contractor.cnicFront)
                                  : toast.error("No CNIC front uploaded")
                              }
                              disabled={!contractor.cnicFront}
                            >
                              🪪 CNIC Front
                            </button>
                            <button
                              className="btn btn-xs btn-outline btn-accent"
                              onClick={() =>
                                contractor.cnicBack
                                  ? setPreviewImage(contractor.cnicBack)
                                  : toast.error("No CNIC back uploaded")
                              }
                              disabled={!contractor.cnicBack}
                            >
                              🪪 CNIC Back
                            </button>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-base-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs opacity-60 font-medium">
                                Availability Status
                              </p>
                              <p className="text-xs text-info">
                                Toggle contractor's work availability
                              </p>
                            </div>
                            <select
                              className="select select-bordered select-sm w-28"
                              value={
                                contractor.availabilityStatus || "Available"
                              }
                              onChange={(e) =>
                                handleContractorToggle(
                                  contractor._id,
                                  "availabilityStatus",
                                  e.target.value,
                                )
                              }
                            >
                              <option value="Available">Available</option>
                              <option value="Busy">Busy</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs opacity-60 font-medium">
                                Trust Status
                              </p>
                              <p className="text-xs text-warning">
                                Mark as trusted professional
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              className="toggle toggle-success"
                              checked={contractor.isTrusted || false}
                              onChange={(e) =>
                                handleContractorToggle(
                                  contractor._id,
                                  "isTrusted",
                                  e.target.checked,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* --- VIEW: ANALYTICS --- */}
      {currentView === "analytics" && <FinancialAnalytics />}

      {/* --- VIEW: SETTINGS --- */}
      {currentView === "settings" && (
        <div className="max-w-4xl mx-auto">
          {sectionLoading.settings ? (
            <TabLoader />
          ) : (
            <div className="bg-base-100 rounded-xl shadow border border-base-200 p-8">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="text-primary" size={32} />
                  <h2 className="text-3xl font-bold">Admin Settings</h2>
                </div>
                <p className="text-sm opacity-60">
                  Manage payment methods and company information
                </p>
              </div>

              <div className="space-y-6 border-t border-base-200 pt-6">
                {/* IBAN Section */}
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6 rounded-lg border border-primary/10">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <DollarSign size={24} className="text-primary" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label font-semibold">
                        <span className="label-text">IBAN Number *</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter IBAN (e.g., AE070331234567890123456)"
                        className="input input-bordered w-full bg-base-100"
                        value={adminSettings.ibanNumber}
                        onChange={(e) =>
                          setAdminSettings({
                            ...adminSettings,
                            ibanNumber: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs opacity-60 mt-1">
                        This is the bank account where users will send payments
                      </p>
                    </div>

                    <div>
                      <label className="label font-semibold">
                        <span className="label-text">Bank Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Emirates NBD"
                        className="input input-bordered w-full bg-base-100"
                        value={adminSettings.bankName}
                        onChange={(e) =>
                          setAdminSettings({
                            ...adminSettings,
                            bankName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="label font-semibold">
                        <span className="label-text">Account Holder Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Name on bank account"
                        className="input input-bordered w-full bg-base-100"
                        value={adminSettings.accountHolderName}
                        onChange={(e) =>
                          setAdminSettings({
                            ...adminSettings,
                            accountHolderName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Company Info Section */}
                <div className="bg-gradient-to-br from-info/5 to-success/5 p-6 rounded-lg border border-info/10">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <ShieldCheck size={24} className="text-info" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label font-semibold">
                        <span className="label-text">Company Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full bg-base-100"
                        value={adminSettings.companyName}
                        onChange={(e) =>
                          setAdminSettings({
                            ...adminSettings,
                            companyName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="label font-semibold">
                        <span className="label-text">Company Email</span>
                      </label>
                      <input
                        type="email"
                        placeholder="support@buildlink.com"
                        className="input input-bordered w-full bg-base-100"
                        value={adminSettings.companyEmail}
                        onChange={(e) =>
                          setAdminSettings({
                            ...adminSettings,
                            companyEmail: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="label font-semibold">
                        <span className="label-text">Company Phone</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+971 4 123 4567"
                        className="input input-bordered w-full bg-base-100"
                        value={adminSettings.companyPhone}
                        onChange={(e) =>
                          setAdminSettings({
                            ...adminSettings,
                            companyPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-3 pt-6 border-t border-base-200">
                  <button
                    onClick={() => fetchSectionData("settings")}
                    disabled={isSavingSettings}
                    className="btn btn-outline"
                  >
                    Reset Changes
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings || !adminSettings.ibanNumber}
                    className="btn btn-primary gap-2"
                  >
                    {isSavingSettings ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: PAY WITHDRAWAL --- */}
      {showPayModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowPayModal(false);
                setSelectedWithdrawal(null);
              }}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>

            <h3 className="font-bold text-2xl mb-6">Process Payment</h3>

            <div className="bg-base-200 p-5 rounded-xl mb-6 space-y-4">
              <div>
                <p className="text-xs opacity-70 font-bold uppercase tracking-wide">
                  Contractor
                </p>
                <p className="font-semibold text-lg text-primary">
                  {selectedWithdrawal.user?.fullName || "Unknown"}
                </p>
              </div>
              <div className="border-t border-base-300 pt-4">
                <p className="text-xs opacity-70 font-bold uppercase tracking-wide">
                  Amount
                </p>
                <p className="text-3xl font-bold text-success">
                  Rs. {selectedWithdrawal.amount.toLocaleString()}
                </p>
              </div>
              <div className="border-t border-base-300 pt-4">
                <p className="text-xs opacity-70 font-bold uppercase tracking-wide">
                  Payment Method
                </p>
                <p className="font-semibold text-base">
                  {selectedWithdrawal.method}
                </p>
              </div>
              <div className="border-t border-base-300 pt-4">
                <p className="text-xs opacity-70 font-bold uppercase tracking-wide">
                  Account Details
                </p>
                <p className="font-mono text-base font-bold">
                  {selectedWithdrawal.accountDetails}
                </p>
              </div>
            </div>

            <div className="bg-info/15 border-2 border-info/40 rounded-xl p-4 mb-6">
              <p className="text-sm leading-relaxed">
                📤 Please transfer Rs.{" "}
                {selectedWithdrawal.amount.toLocaleString()} to the contractor's{" "}
                <strong>{selectedWithdrawal.method}</strong> account, then click
                "Next" to upload the payment proof.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedWithdrawal(null);
                }}
                className="btn btn-outline font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setShowProofModal(true);
                }}
                className="btn btn-primary text-white font-semibold gap-2"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: SUBMIT PROOF --- */}
      {showProofModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => {
                setShowProofModal(false);
                setSelectedWithdrawal(null);
                setAdminProof(null);
              }}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              ✕
            </button>

            <h3 className="font-bold text-2xl mb-6">Upload Payment Proof</h3>

            <div className="bg-base-200 p-5 rounded-xl mb-6 space-y-3">
              <div>
                <p className="text-xs opacity-70 font-bold uppercase">To</p>
                <p className="font-semibold">
                  {selectedWithdrawal.user?.fullName || "Unknown"}
                </p>
              </div>
              <div className="border-t border-base-300 pt-3">
                <p className="text-xs opacity-70 font-bold uppercase">Amount</p>
                <p className="text-lg font-bold text-success">
                  Rs. {selectedWithdrawal.amount.toLocaleString()}
                </p>
              </div>
              <div className="border-t border-base-300 pt-3">
                <p className="text-xs opacity-70 font-bold uppercase">Method</p>
                <p className="font-semibold text-sm">
                  {selectedWithdrawal.method} •{" "}
                  {selectedWithdrawal.accountDetails}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="label font-bold">
                <span className="label-text text-base">Payment Screenshot</span>
              </label>
              {!adminProof ? (
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label
                    htmlFor="proof-upload"
                    className="cursor-pointer block"
                  >
                    <Upload
                      size={32}
                      className="mx-auto mb-2 text-primary/60"
                    />
                    <p className="text-sm font-semibold">
                      Click to upload or drag
                    </p>
                    <p className="text-xs opacity-60">PNG, JPG up to 5MB</p>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <img
                    src={adminProof}
                    alt="Proof Preview"
                    className="w-full h-40 object-cover rounded-xl border-2 border-success/30"
                  />
                  <button
                    onClick={() => setAdminProof(null)}
                    type="button"
                    className="btn btn-sm btn-outline w-full"
                  >
                    Change Image
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setSelectedWithdrawal(null);
                  setAdminProof(null);
                }}
                className="btn btn-outline font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessWithdrawal}
                disabled={!adminProof}
                className="btn btn-success text-white font-semibold gap-2"
              >
                <CheckCircle size={18} /> Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ AI SUMMARY MODAL - NOW PROPERLY PLACED OUTSIDE ALL VIEW CONDITIONS */}
      {showSummaryModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-3xl">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
              <Bot className="text-primary" /> AI Dispute Analysis
            </h3>

            {summaryLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="mt-4 opacity-60 animate-pulse">
                  Analyzing claims, evidence, and defense...
                </p>
              </div>
            ) : (
              <div className="prose bg-base-200 p-6 rounded-lg max-h-[60vh] overflow-y-auto w-full max-w-none">
                <div className="whitespace-pre-wrap">
                  {aiSummary || "No analysis available"}
                </div>
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowSummaryModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ImagePreviewModal
        imageUrl={previewImage}
        alt="Proof Preview"
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default AdminDashboard;
