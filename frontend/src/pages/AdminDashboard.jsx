import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
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
} from "lucide-react";

const AdminDashboard = ({ externalView = null }) => {
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [contractors, setContractors] = useState([]);

  const [sectionLoading, setSectionLoading] = useState({
    payments: false,
    withdrawals: false,
    disputes: false,
    users: false,
    contractors: false,
  });

  const [loadedSections, setLoadedSections] = useState({
    payments: false,
    withdrawals: false,
    disputes: false,
    users: false,
    contractors: false,
  });

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

  useEffect(() => {
    let sectionToFetch = currentView;
    if (currentView === "bookings") sectionToFetch = "payments";
    fetchSectionData(sectionToFetch);
  }, [currentView]);

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
                pendingPayments.map((b) => (
                  <div
                    key={b._id}
                    className="card bg-base-100 shadow border p-6 flex-row gap-6"
                  >
                    <div
                      className="relative w-32 h-32 cursor-pointer group"
                      onClick={() => setPreviewImage(b.paymentScreenshot)}
                    >
                      <img
                        src={b.paymentScreenshot}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-lg bg-base-200 border border-base-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Maximize2 className="text-white" size={24} />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{b.serviceName}</h3>
                      <p className="opacity-70">
                        User: {b.user?.fullName || "Unknown User"} → Pro:{" "}
                        {b.contractor?.fullName || "Unknown Contractor"}
                      </p>
                      <p className="font-bold text-primary mt-2">
                        Amount: Rs. {b.totalPrice}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleVerifyPayment(b._id, "approve")}
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
                ))
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
                  className="card bg-base-100 shadow-lg border-l-4 border-error"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="card-title text-error flex items-center gap-2">
                          <AlertTriangle size={20} />
                          {d.booking?.serviceName || "Dispute"}
                        </h3>
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
                      className="bg-base-100 rounded-lg shadow border border-base-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                    >
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b border-base-200">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-bold text-base">
                              {booking.serviceName}
                            </h3>
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
                              Booking Date
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

                        <div className="flex items-start gap-3">
                          <span className="text-info mt-1">⏱️</span>
                          <div className="flex-1">
                            <p className="text-xs opacity-60 font-medium">
                              Time
                            </p>
                            <p className="text-sm font-semibold">
                              {booking.booking_start_time
                                ? new Date(
                                    booking.booking_start_time,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "N/A"}
                              {booking.booking_end_time &&
                                ` - ${new Date(
                                  booking.booking_end_time,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`}
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
                        {booking.paymentScreenshot ? "✓ Verified" : "⊗ Pending"}
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
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                            {user.fullName?.charAt(0).toUpperCase()}
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning to-error flex items-center justify-center text-white font-bold relative">
                              {contractor.fullName?.charAt(0).toUpperCase()}
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

      {/* ✅ LIGHTBOX: FULL SCREEN IMAGE PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <X size={40} />
          </button>

          <img
            src={previewImage}
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl scale-100"
            alt="Proof Preview"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
