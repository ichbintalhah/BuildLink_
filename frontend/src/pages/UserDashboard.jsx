import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import PaymentModal from "../components/PaymentModal";
import ReviewModal from "../components/ReviewModal";
import PageLoader from "../components/PageLoader";
import CountdownTimer from "../components/CountdownTimer";
import DisputeDecisionCard from "../components/DisputeDecisionCard";
import { Link, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Clock,
  Briefcase,
  Filter,
  Calendar,
  Wallet,
  X,
} from "lucide-react";

const UserDashboard = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [payBooking, setPayBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Review State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewFromSatisfaction, setReviewFromSatisfaction] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // Moved state here

  // Filter State
  const [filterStatus, setFilterStatus] = useState("All");

  // Withdrawal State
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("");
  const [accountDetails, setAccountDetails] = useState("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get("/bookings?limit=50");
      const bookingList = Array.isArray(data) ? data : data.bookings;
      console.log("📋 User Bookings Fetched:", bookingList);
      // Log bookings pending payment with timer
      bookingList.forEach((b) => {
        if (
          b.status === "Payment_Pending" ||
          b.status === "Approved_Pay_Pending"
        ) {
          console.log(`💳 Payment Pending Booking: ${b._id}`, {
            paymentExpiresAt: b.paymentExpiresAt,
            status: b.status,
          });
        }
      });
      setBookings(bookingList);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!showWithdrawalModal || !user) return;

    const refreshAndAutofill = async () => {
      let latestUser = user;

      try {
        if (user.role === "user") {
          const { data } = await api.get("/users/profile");
          latestUser = { ...user, ...data };
          setUser(latestUser);
        }
      } catch (error) {
        console.error("Failed to refresh profile:", error);
      }

      const preferredMethod =
        latestUser.paymentMethod ||
        latestUser.contractorDetails?.paymentMethod ||
        "";

      const preferredAccount =
        latestUser.paymentAccountValue ||
        latestUser.paymentAccount ||
        latestUser.contractorDetails?.paymentAccount ||
        latestUser.contractorDetails?.phoneForMobileWallet ||
        latestUser.contractorDetails?.ibanNumber ||
        "";

      setWithdrawalMethod(preferredMethod);
      setAccountDetails(preferredAccount);
    };

    refreshAndAutofill();
  }, [showWithdrawalModal, user, setUser]);

  const handleSatisfied = (booking) => {
    setReviewBooking(booking);
    setReviewFromSatisfaction(true);
  };

  // Handle Withdrawal Request
  const handleWithdrawalRequest = async (e) => {
    e.preventDefault();

    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) {
      return toast.error("Please enter a valid amount");
    }

    if (amount > (user?.walletBalance || 0)) {
      return toast.error("Insufficient balance");
    }

    if (!withdrawalMethod || !accountDetails) {
      return toast.error("Please fill all withdrawal details");
    }

    try {
      setWithdrawalLoading(true);
      await api.post("/wallet/withdraw", {
        amount,
        method: withdrawalMethod,
        accountDetails,
      });

      toast.success(
        "Withdrawal request submitted! Admin will process it soon.",
      );

      // Update user balance locally
      setUser({ ...user, walletBalance: user.walletBalance - amount });

      // Reset form and close modal
      setWithdrawalAmount("");
      setWithdrawalMethod("");
      setAccountDetails("");
      setShowWithdrawalModal(false);
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to submit withdrawal request",
      );
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // --- FIX STARTS HERE ---
  // I removed the duplicate/broken getStatusColor definition
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending_Approval":
        return "border-l-warning";
      case "Active":
        return "border-l-primary";
      case "Completed_And_Confirmed":
        return "border-l-success";
      case "Disputed":
        return "border-l-error";
      default:
        return "border-l-base-300";
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === "All") return true;
    if (filterStatus === "Active")
      return ["Active", "Pending_Approval", "Verification_Pending"].includes(
        b.status,
      );
    if (filterStatus === "Completed")
      return ["Completed", "Completed_And_Confirmed"].includes(b.status);
    return true;
  });

  return (
    <>
      <PageLoader isLoading={isLoading} message="Loading your dashboard..." />

      <div className="max-w-6xl mx-auto space-y-6 pb-10">
        {/* HEADER & STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gradient-to-r from-primary to-primary-focus rounded-2xl p-8 text-primary-content shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold">
                Hello, {user?.fullName}! 👋
              </h1>
              <p className="opacity-90 mt-2">
                Track your ongoing jobs and payment history here.
              </p>
              <Link
                to="/contractors"
                className="btn btn-white text-primary mt-6 border-none shadow-md"
              >
                <Briefcase size={18} /> Book New Service
              </Link>
            </div>
            <Briefcase
              size={150}
              className="absolute -right-6 -bottom-6 opacity-10 rotate-12"
            />
          </div>

          <div className="space-y-4">
            <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200 flex flex-col justify-center items-center">
              <div
                className="radial-progress text-primary font-bold text-xl"
                style={{ "--value": 70, "--size": "6rem" }}
              >
                {bookings.length}
              </div>
              <p className="mt-4 text-sm font-bold opacity-60">
                Total Bookings
              </p>
            </div>

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-success to-success-focus rounded-2xl p-6 shadow-sm border border-success text-white">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={20} />
                <p className="text-sm font-semibold opacity-90">
                  Wallet Balance
                </p>
              </div>
              <p className="text-3xl font-bold mb-3">
                Rs. {(user?.walletBalance || 0).toLocaleString()}
              </p>
              <button
                onClick={() => setShowWithdrawalModal(true)}
                className="btn btn-sm btn-white text-success w-full border-none shadow-md hover:scale-105 transition-transform"
              >
                <Wallet size={16} /> Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        {/* TABS FILTER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-8 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Filter size={20} className="text-primary" /> Your Bookings
          </h2>
          <div className="join gap-1">
            <button
              className={`join-item btn btn-sm transition-all duration-200 ${
                filterStatus === "All"
                  ? "btn-primary shadow-lg"
                  : "btn-outline hover:bg-base-200"
              }`}
              onClick={() => setFilterStatus("All")}
            >
              All
            </button>
            <button
              className={`join-item btn btn-sm transition-all duration-200 ${
                filterStatus === "Active"
                  ? "btn-primary shadow-lg"
                  : "btn-outline hover:bg-base-200"
              }`}
              onClick={() => setFilterStatus("Active")}
            >
              Active
            </button>
            <button
              className={`join-item btn btn-sm transition-all duration-200 ${
                filterStatus === "Completed"
                  ? "btn-primary shadow-lg"
                  : "btn-outline hover:bg-base-200"
              }`}
              onClick={() => setFilterStatus("Completed")}
            >
              Completed
            </button>
          </div>
        </div>

        {/* BOOKINGS LIST */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-20 bg-base-100 rounded-xl border border-dashed border-base-300">
              <Briefcase className="mx-auto h-12 w-12 text-base-300 mb-3" />
              <h3 className="font-bold text-lg">No bookings found</h3>
              <p className="text-sm opacity-60">
                You haven't booked any services yet.
              </p>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div
                key={b._id}
                className={`card bg-base-100 shadow-sm border-2 border-base-200 hover:shadow-lg hover:border-primary/40 transition-all duration-200 group cursor-pointer ${getStatusColor(
                  b.status,
                )} border-l-[6px]`}
              >
                <div className="card-body p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* LEFT: INFO */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-primary group-hover:translate-x-1 transition-transform duration-200">
                          {b.serviceName}
                        </h3>
                        <div className="badge badge-ghost font-mono group-hover:badge-primary transition-colors duration-200">
                          ID: {b._id.slice(-6)}
                        </div>
                      </div>

                      {b.completionImages && b.completionImages.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-xs font-bold uppercase opacity-60">
                            Completion Proof
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {b.completionImages.map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="w-full h-24 rounded-lg overflow-hidden border border-base-300 focus:outline-none focus:ring-2 focus:ring-primary"
                                onClick={() => setPreviewImage(img)}
                              >
                                <img
                                  src={img}
                                  alt={`Completion proof ${idx + 1}`}
                                  className="w-full h-full object-cover transition hover:opacity-90"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display Dispute Decision if exists */}
                      {b.dispute && <DisputeDecisionCard dispute={b.dispute} />}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm opacity-70 group-hover:opacity-100 transition-opacity duration-200 mt-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>
                            {new Date(b.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} />
                          <span>
                            Provider: {b.contractor?.fullName || "Unassigned"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          <span>{b.bookingHours} Hours</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-base-content">
                          <CreditCard size={14} />
                          <span>Rs. {b.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: ACTIONS */}
                    <div className="flex flex-col gap-2 min-w-[200px] justify-center border-l border-base-200 pl-4">
                      <div className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">
                        Status
                      </div>
                      <div
                        className={`badge badge-lg w-full font-bold transition-all duration-200 ${
                          b.status === "Active"
                            ? "badge-primary shadow-lg"
                            : b.status === "Completed_And_Confirmed"
                              ? "badge-success text-white shadow-lg"
                              : "badge-ghost group-hover:bg-base-200"
                        }`}
                      >
                        {b.status.replace(/_/g, " ")}
                      </div>

                      {(b.status === "Pending_Approval" ||
                        b.status === "Pending_Contractor_Approval") && (
                        <div className="text-xs text-warning font-medium mt-2 flex items-center gap-1 bg-warning/10 p-2 rounded-md border border-warning/30">
                          <Clock size={12} /> Waiting for Contractor
                        </div>
                      )}

                      {(b.status === "Approved_Pay_Pending" ||
                        b.status === "Payment_Pending") && (
                        <div className="space-y-2 mt-2">
                          {/* Show countdown timer for Payment_Pending status */}
                          {b.status === "Payment_Pending" &&
                            (b.paymentExpiresAt ? (
                              <CountdownTimer
                                endTime={b.paymentExpiresAt}
                                label="Upload Payment Within"
                              />
                            ) : (
                              <div className="text-xs bg-warning/20 p-2 rounded border border-warning/50 text-center">
                                ⚠️ Payment deadline data missing
                              </div>
                            ))}
                          {b.paymentExpired && (
                            <div className="text-xs bg-error/20 p-2 rounded border border-error/50 text-center font-bold text-error">
                              ❌ PAYMENT EXPIRED - Job Cancelled
                            </div>
                          )}
                          <button
                            onClick={() => setPayBooking(b)}
                            disabled={b.paymentExpired}
                            className={`btn btn-sm w-full font-semibold hover:shadow-lg transition-all duration-200 gap-2 ${
                              b.paymentExpired ? "btn-disabled" : "btn-primary"
                            }`}
                          >
                            <CreditCard size={14} />{" "}
                            {b.paymentExpired
                              ? "Payment Expired"
                              : "Pay Now / Upload Proof"}
                          </button>
                        </div>
                      )}

                      {b.status === "Completed" && (
                        <div className="space-y-2 mt-2">
                          {(() => {
                            const deadline = b.completedAt
                              ? new Date(b.completedAt).getTime() +
                                3 * 60 * 60 * 1000
                              : null;
                            return (
                              <CountdownTimer
                                hours={3}
                                endTime={deadline}
                                label="Time to Review (3 Hours) - Auto pays contractor if you don't respond"
                              />
                            );
                          })()}
                          <div className="text-xs bg-info/20 p-2 rounded border border-info/50 text-center">
                            ⏱️ If you don't act within 3 hours, contractor
                            receives automatic payment
                          </div>
                          <button
                            onClick={() => handleSatisfied(b)}
                            className="btn btn-sm btn-success w-full text-white font-semibold hover:shadow-lg transition-all duration-200"
                          >
                            I Am Satisfied
                          </button>
                          <Link
                            to="/dashboard/disputes"
                            state={{ bookingId: b._id }}
                            className="btn btn-sm btn-outline btn-error w-full font-semibold hover:bg-error/10 transition-all duration-200"
                          >
                            Report Issue
                          </Link>
                        </div>
                      )}

                      {b.status === "Disputed" && (
                        <Link
                          to="/dashboard/disputes"
                          className="btn btn-sm btn-error w-full text-white font-semibold mt-2 hover:shadow-lg transition-all duration-200"
                        >
                          View Dispute Status
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {payBooking && (
          <PaymentModal
            booking={payBooking}
            onClose={() => setPayBooking(null)}
            onSuccess={fetchBookings}
          />
        )}
        {reviewBooking && (
          <ReviewModal
            booking={reviewBooking}
            onClose={() => {
              setReviewBooking(null);
              setReviewFromSatisfaction(false);
            }}
            onSuccess={fetchBookings}
            fromSatisfaction={reviewFromSatisfaction}
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
                alt="Completion proof"
                className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-base-300 bg-base-100"
              />
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Wallet className="text-success" size={24} />
                  Withdraw Funds
                </h3>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="btn btn-sm btn-circle btn-ghost"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Available Balance
                    </span>
                  </label>
                  <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-success">
                      Rs. {(user?.walletBalance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Withdrawal Amount
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    placeholder="Enter amount"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    max={user?.walletBalance || 0}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Payment Method
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={withdrawalMethod}
                    onChange={(e) => setWithdrawalMethod(e.target.value)}
                    required
                  >
                    <option value="">Select Method</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="Bank Account">Bank Account</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="SadaPay">SadaPay</option>
                    <option value="NayaPay">NayaPay</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Account Details (Phone or IBAN)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="03XX-XXXXXXX or PKXX..."
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawalModal(false)}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawalLoading}
                    className="btn btn-success text-white flex-1"
                  >
                    {withdrawalLoading ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      <>
                        <Wallet size={16} />
                        Submit Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserDashboard;
