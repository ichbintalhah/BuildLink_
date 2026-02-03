import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import SkeletonLoader from "../components/SkeletonLoader";
import CountdownTimer from "../components/CountdownTimer";
import DisputeDecisionCard from "../components/DisputeDecisionCard";
import {
  DollarSign,
  Briefcase,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  Phone,
  CreditCard,
  Hammer,
  Star,
  History,
  Download,
} from "lucide-react";
import CompletionModal from "../components/CompletionModal";

const ContractorDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [completeJob, setCompleteJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const { user, setUser } = useContext(AuthContext);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const [bookingsRes, contractorRes, historyRes] = await Promise.allSettled(
        [
          api.get("/bookings?limit=20"),
          api.get("/contractors/profile"),
          api.get("/wallet/history").catch(() => ({ data: [] })),
        ],
      );

      // Handle Bookings
      if (bookingsRes.status === "fulfilled") {
        const bookingList = Array.isArray(bookingsRes.value.data)
          ? bookingsRes.value.data
          : bookingsRes.value.data.bookings || [];
        console.log("📋 Fetched Bookings:", bookingList);
        // Log pending bookings with acceptance timer
        bookingList.forEach((b) => {
          if (
            b.status === "Pending_Contractor_Approval" ||
            b.status === "Pending_Approval"
          ) {
            console.log(`⏰ Pending Booking: ${b._id}`, {
              acceptanceExpiresAt: b.acceptanceExpiresAt,
              isEmergency: b.isEmergency,
              status: b.status,
            });
          }
        });
        setBookings(bookingList);
      } else {
        console.warn("Bookings failed to load:", bookingsRes.reason);
        setBookings([]);
      }

      // Handle Contractor Profile
      if (contractorRes.status === "fulfilled") {
        setUser(contractorRes.value.data);
      } else {
        console.warn(
          "Contractor profile failed to load:",
          contractorRes.reason,
        );
      }

      // Handle Withdrawal History
      if (historyRes.status === "fulfilled") {
        setWithdrawalHistory(historyRes.value.data || []);
      } else {
        console.warn("Withdrawal history failed to load");
        setWithdrawalHistory([]);
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ✅ Handle Accept / Reject Function
  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}`, { status });
      toast.success(status === "Accepted" ? "Job Accepted!" : "Job Rejected");
      fetchBookings(); // Refresh list to see changes
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const activeJobs = bookings.filter((b) => b.status === "Active").length;
  const pendingJobs = bookings.filter((b) =>
    b.status.includes("Pending"),
  ).length;
  const totalEarnings = user?.walletBalance || 0;

  if (isLoading) return <SkeletonLoader />;

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* HEADER & STATUS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
          <div>
            <h1 className="text-3xl font-bold">Contractor Workspace</h1>
            <p className="opacity-60">Manage your jobs and earnings</p>
          </div>

          <div className="flex items-center gap-4 bg-base-200 px-5 py-3 rounded-xl">
            <div className="text-right">
              <p className="text-xs uppercase font-bold opacity-50">
                Current Status
              </p>
              <p
                className={`font-bold ${
                  user.availabilityStatus === "Available" ||
                  user.availability === "Green"
                    ? "text-success"
                    : "text-error"
                }`}
              >
                {user.availabilityStatus === "Available" ||
                user.availability === "Green"
                  ? "Available for Work"
                  : "Busy / On Job"}
              </p>
            </div>
            <div className="relative">
              <div
                className={`w-4 h-4 rounded-full ${
                  user.availabilityStatus === "Available" ||
                  user.availability === "Green"
                    ? "bg-success"
                    : "bg-error"
                }`}
              ></div>
            </div>
          </div>
        </div>

        {/* WITHDRAWAL CTA + HISTORY TOGGLE */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
          <Link
            to="/withdrawal-request"
            className="btn btn-success btn-lg w-full md:w-auto shadow-lg gap-2 text-white font-bold"
          >
            <DollarSign size={24} /> Withdraw Funds
          </Link>

          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="btn btn-outline md:btn-md btn-sm w-full md:w-auto gap-2"
          >
            <History size={18} /> {showHistory ? "Hide" : "View"} Withdrawal
            History
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Briefcase size={24} />
              </div>
              <div className="stat-title">Active Jobs</div>
              <div className="stat-value text-primary">{activeJobs}</div>
            </div>
          </div>

          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-warning">
                <Clock size={24} />
              </div>
              <div className="stat-title">Pending</div>
              <div className="stat-value text-warning">{pendingJobs}</div>
            </div>
          </div>

          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-success">
                <DollarSign size={24} />
              </div>
              <div className="stat-title">Wallet</div>
              <div className="stat-value text-success">
                Rs. {totalEarnings.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="stats shadow border border-base-200">
            <div className="stat">
              <div className="stat-figure text-info">
                <Star size={24} />
              </div>
              <div className="stat-title">Rating</div>
              <div className="stat-value text-info">
                {user.rating ? user.rating.toFixed(1) : "New"}
              </div>
            </div>
          </div>
        </div>

        {/* JOB LIST */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Hammer size={20} /> My Jobs
          </h2>

          {bookings.length === 0 ? (
            <div className="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-base-300">
              <Briefcase size={48} className="mx-auto text-base-300 mb-4" />
              <h3 className="text-lg font-bold opacity-50">No jobs found</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div
                  key={b._id}
                  className="card md:card-side bg-base-100 shadow-sm border border-base-200 hover:shadow-lg hover:border-primary/30 transition-all duration-200 group"
                >
                  <div className="card-body p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      {/* Job Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between md:justify-start gap-3">
                          <h3 className="card-title text-lg font-bold text-primary group-hover:translate-x-1 transition-transform duration-200">
                            {b.serviceName}
                          </h3>
                          {/* BADGE logic */}
                          <span
                            className={`badge font-bold px-3 py-1 transition-all duration-200 ${
                              b.status === "Active"
                                ? "badge-success text-white shadow-lg"
                                : "badge-ghost group-hover:bg-base-200"
                            }`}
                          >
                            {b.status === "Pending_Contractor_Approval"
                              ? "New Request"
                              : b.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-sm opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-primary" />
                            <span className="font-bold">Client:</span>{" "}
                            {b.user?.fullName || "Unknown"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-primary" />
                            <span className="font-bold">Date:</span>{" "}
                            {new Date(b.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-primary" />
                            <span className="font-bold">Start:</span>{" "}
                            {b.booking_start_time || "—"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-primary" />
                            <span className="font-bold">End:</span>{" "}
                            {b.booking_end_time
                              ? new Date(b.booking_end_time).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )
                              : "—"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-primary" />
                            <span className="font-bold">Duration:</span>{" "}
                            {b.totalDuration
                              ? `${b.totalDuration} hour${
                                  b.totalDuration !== 1 ? "s" : ""
                                }`
                              : b.bookingHours
                                ? `${b.bookingHours} hrs`
                                : "—"}
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard size={14} className="text-primary" />
                            <span className="font-bold">Total:</span> Rs.{" "}
                            {b.totalPrice.toLocaleString()}
                          </div>

                          {/* Show Location before job is active, Address after payment verified */}
                          {b.phoneNumbersVisible
                            ? // Show full Address when payment is verified
                              b.user?.address && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                  <MapPin size={14} className="text-success" />
                                  <span className="font-bold">
                                    Address:
                                  </span>{" "}
                                  <span className="text-success font-semibold">
                                    {b.user.address}
                                  </span>
                                </div>
                              )
                            : // Show only Location before payment is verified
                              b.user?.location && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                  <MapPin size={14} className="text-primary" />
                                  <span className="font-bold">
                                    Location:
                                  </span>{" "}
                                  <span className="font-semibold">
                                    {b.user.location}
                                  </span>
                                </div>
                              )}

                          {/* Show Phone only when payment is verified */}
                          {b.phoneNumbersVisible && b.user?.phone && (
                            <div className="flex items-center gap-2 md:col-span-2">
                              <Phone size={14} className="text-success" />
                              <span className="font-bold">Phone:</span>{" "}
                              <span className="text-success font-semibold">
                                {b.user.phone}
                              </span>
                            </div>
                          )}

                          {/* Show locked message when payment not yet verified */}
                          {!b.phoneNumbersVisible &&
                            (b.status === "Verification_Pending" ||
                              b.status === "Payment_Pending" ||
                              b.status === "Pending_Contractor_Approval") && (
                              <div className="flex items-center gap-2 md:col-span-2">
                                <AlertTriangle
                                  size={14}
                                  className="text-warning"
                                />
                                <span className="text-xs opacity-60">
                                  Phone number and full address will show after
                                  admin verifies payment
                                </span>
                              </div>
                            )}

                          {/* Display Dispute Decision if exists */}
                          {b.dispute && (
                            <div className="md:col-span-2">
                              <DisputeDecisionCard dispute={b.dispute} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS COLUMN */}
                      <div className="flex flex-col items-end gap-3 justify-center min-w-[180px]">
                        {/* ✅ 1. NEW REQUEST: Contractor Must Accept First */}
                        {/* We handle BOTH the new status name AND the old one just in case */}
                        {(b.status === "Pending_Contractor_Approval" ||
                          b.status === "Pending_Approval") && (
                          <div className="flex flex-col gap-3 w-full">
                            {/* Countdown Timer for Acceptance */}
                            {b.acceptanceExpiresAt ? (
                              <CountdownTimer
                                endTime={b.acceptanceExpiresAt}
                                label={
                                  b.isEmergency
                                    ? "EMERGENCY - Respond Now!"
                                    : "Respond Within"
                                }
                              />
                            ) : (
                              <div className="text-xs bg-warning/20 p-2 rounded border border-warning/50 text-center">
                                ⚠️ Old booking (no timer data)
                              </div>
                            )}
                            <button
                              onClick={() =>
                                handleUpdateStatus(b._id, "Accepted")
                              }
                              className="btn btn-success btn-sm w-full text-white font-semibold hover:shadow-lg transition-all duration-200"
                            >
                              Accept Job
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(b._id, "Rejected")
                              }
                              className="btn btn-error btn-sm w-full text-white font-semibold hover:shadow-lg transition-all duration-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* 2. WAITING FOR PAYMENT (User hasn't paid yet) */}
                        {b.status === "Payment_Pending" && (
                          <div className="text-xs text-center opacity-60 font-medium bg-base-200 p-3 rounded-lg border border-base-300 group-hover:border-warning transition-colors duration-200">
                            Waiting for Client Payment
                          </div>
                        )}

                        {/* 3. VERIFICATION PENDING (Admin checking payment) */}
                        {b.status === "Verification_Pending" && (
                          <div className="text-xs text-center opacity-60 font-medium bg-warning/20 text-warning-content p-3 rounded-lg border border-warning/30 group-hover:border-warning/50 transition-colors duration-200">
                            Admin Verifying Payment
                          </div>
                        )}

                        {/* 4. ACTIVE JOB (Work in Progress) */}
                        {b.status === "Active" && (
                          <div className="w-full space-y-3">
                            <CountdownTimer
                              hours={b.totalDuration || 1}
                              endTime={b.booking_end_time}
                              label="Work Time Remaining"
                            />
                            <button
                              onClick={() => setCompleteJob(b)}
                              className="btn btn-success w-full text-white shadow-lg hover:shadow-xl font-semibold transition-all duration-200 gap-2"
                            >
                              <CheckCircle size={18} /> Mark Job Done
                            </button>
                          </div>
                        )}

                        {/* 5. DISPUTE */}
                        {b.status === "Disputed" && (
                          <Link
                            to="/dashboard/disputes"
                            className="btn btn-error w-full text-white animate-pulse gap-2 font-semibold hover:no-animation transition-all duration-200"
                          >
                            <AlertTriangle size={18} /> View Dispute
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WITHDRAWAL HISTORY SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History size={20} /> Withdrawal History
            </h2>
          </div>

          {showHistory && (
            <div className="bg-base-100 rounded-2xl shadow border border-base-200 overflow-x-auto">
              {withdrawalHistory.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <p>No withdrawal history yet</p>
                </div>
              ) : (
                <table className="table w-full">
                  <thead className="bg-base-200">
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalHistory.map((w) => (
                      <tr
                        key={w._id}
                        className="hover:bg-base-200 transition-colors"
                      >
                        <td className="font-semibold">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </td>
                        <td className="font-bold text-success text-lg">
                          Rs. {w.amount.toLocaleString()}
                        </td>
                        <td>
                          <span className="badge badge-outline">
                            {w.method}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge font-bold ${
                              w.status === "Completed"
                                ? "badge-success"
                                : w.status === "Rejected"
                                  ? "badge-error"
                                  : "badge-warning"
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td>
                          {w.transactionScreenshot ? (
                            <button
                              onClick={() =>
                                setPreviewImage(w.transactionScreenshot)
                              }
                              className="btn btn-xs btn-ghost gap-1 text-primary"
                            >
                              <Download size={14} /> View
                            </button>
                          ) : (
                            <span className="opacity-50">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {completeJob && (
        <CompletionModal
          booking={completeJob}
          onClose={() => setCompleteJob(null)}
          onSuccess={fetchBookings}
        />
      )}

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn btn-sm btn-circle absolute -top-3 -right-3"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
            <img
              src={previewImage}
              alt="Withdrawal proof"
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-base-300 bg-base-100"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ContractorDashboard;
