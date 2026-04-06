import { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import PageLoader from "../components/PageLoader";
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
  MessageCircle,
} from "lucide-react";
import CompletionModal from "../components/CompletionModal";
import ImagePreviewModal from "../components/ImagePreviewModal";

const ContractorDashboard = ({ notifState = {} }) => {
  const [bookings, setBookings] = useState([]);
  const [completeJob, setCompleteJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);

  const { user, setUser, getSessionVersion } = useContext(AuthContext);
  const navigate = useNavigate();

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchBookings = async () => {
    // Capture the session version at the start of this request
    const capturedVersion = getSessionVersion();
    try {
      setIsLoading(true);
      const [bookingsRes, contractorRes, historyRes] = await Promise.allSettled(
        [
          api.get("/bookings?limit=20"),
          api.get("/contractors/profile"),
          api.get("/wallet/history?limit=50").catch(() => ({ data: [] })),
        ],
      );

      // Guard: If component unmounted or session changed, discard everything
      if (!mountedRef.current) return;

      // Handle Bookings
      if (bookingsRes.status === "fulfilled") {
        const bookingList = Array.isArray(bookingsRes.value.data)
          ? bookingsRes.value.data
          : bookingsRes.value.data.bookings || [];
        setBookings(bookingList);
      } else {
        setBookings([]);
      }

      // Handle Contractor Profile — use session-aware setUser
      if (contractorRes.status === "fulfilled") {
        setUser(contractorRes.value.data, capturedVersion);
      }

      // Handle Withdrawal History
      if (historyRes.status === "fulfilled") {
        setWithdrawalHistory(historyRes.value.data || []);
      } else {
        setWithdrawalHistory([]);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      console.error("Dashboard Load Error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle notification navigation - scroll to relevant booking and auto-open withdrawal history
  useEffect(() => {
    if (!notifState.fromNotification || isLoading) return;

    const category = notifState.notifCategory;
    const bookingId = notifState.bookingId;

    // Auto-open withdrawal history for withdrawal-related notifications
    if (
      category === "withdrawal_approved" ||
      category === "withdrawal_rejected" ||
      category === "withdrawal_processed"
    ) {
      setShowHistory(true);
      // Scroll to withdrawal section after render
      setTimeout(() => {
        const el = document.getElementById("contractor-withdrawal-history");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      return;
    }

    // Scroll to specific booking card
    if (bookingId) {
      setHighlightedBookingId(bookingId);
      setTimeout(() => {
        const el = document.getElementById(`booking-card-${bookingId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary", "ring-offset-2");
          // Remove highlight after 3 seconds
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            setHighlightedBookingId(null);
          }, 3000);
        }
      }, 300);
    }
  }, [notifState, isLoading]);

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

  // Handle Negotiate button
  const handleNegotiate = async (booking) => {
    try {
      const customerId = booking.user._id || booking.user;

      // Send notification to customer
      await api.post("/dashboard/notifications/create", {
        userId: customerId,
        message: `Contractor ${user.fullName} wants to negotiate on your ${booking.serviceName} booking.`,
        type: "info",
        relatedBooking: booking._id,
        notifCategory: "booking_request",
      });

      // Start or find conversation (without initial message)
      const { data } = await api.post("/messages/start", {
        customerId: customerId,
        projectType: booking.serviceName,
      });

      toast.success("Opening chat with customer...");

      // Navigate to messages tab with conversation info
      navigate("/dashboard/messages", {
        state: {
          selectConversationId: data._id,
          customerId: customerId,
        },
      });
    } catch (error) {
      console.error("Negotiate error:", error);
      toast.error("Failed to start negotiation");
    }
  };

  const getExactMilestoneDeadline = (booking) => {
    const currentMilestoneIndex = booking?.currentMilestone || 0;
    const schedule = booking?.paymentSchedule || [];
    const currentMilestone = schedule[currentMilestoneIndex];

    if (!currentMilestone) return null;

    // Use the backend-computed milestoneDeadline directly (set fresh by verifyPayment)
    if (currentMilestone.milestoneDeadline) {
      return new Date(currentMilestone.milestoneDeadline);
    }

    return null;
  };

  const renderJobReview = (booking) => {
    const numericRating = Number(booking?.rating);
    const hasRating = Number.isFinite(numericRating) && numericRating > 0;
    const hasReviewText =
      typeof booking?.reviewText === "string" &&
      booking.reviewText.trim().length > 0;

    if (!hasRating && !hasReviewText) return null;

    return (
      <div className="mt-3 bg-success/10 border border-success/30 rounded-lg p-3">
        <div className="text-xs font-bold uppercase tracking-wide text-success mb-2">
          Client Rating & Review
        </div>

        {hasRating ? (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((starValue) => (
              <Star
                key={starValue}
                size={14}
                className={
                  starValue <= Math.round(numericRating)
                    ? "text-warning fill-warning"
                    : "text-base-300"
                }
              />
            ))}
            <span className="text-sm font-bold ml-1">{numericRating}/5</span>
          </div>
        ) : (
          <span className="text-xs opacity-70">Rating not provided</span>
        )}

        {hasReviewText && (
          <p className="text-sm italic mt-2 text-base-content/80 break-words">
            "{booking.reviewText}"
          </p>
        )}
      </div>
    );
  };

  const isRenderableImageUrl = (value) => {
    if (typeof value !== "string" || !value.trim()) return false;

    try {
      const parsedUrl = new URL(value);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;

      const path = (parsedUrl.pathname || "").toLowerCase();
      const isCloudinary = /(^|\.)res\.cloudinary\.com$/i.test(
        parsedUrl.hostname,
      );

      if (isCloudinary) return true;

      return /\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(path);
    } catch {
      return false;
    }
  };

  const getThumbnailUrl = (url) => {
    if (typeof url !== "string") return "";

    // Use Cloudinary transforms for smaller card thumbnails.
    if (url.includes("/upload/")) {
      return url.replace(
        "/upload/",
        "/upload/f_auto,q_auto,w_360,h_240,c_fill/",
      );
    }

    return url;
  };

  const getSafeProblemImages = (booking) => {
    const images = Array.isArray(booking?.problemImages)
      ? booking.problemImages
      : [];

    return images
      .filter(isRenderableImageUrl)
      .map((item) => item.trim())
      .slice(0, 5);
  };

  const renderProblemImages = (booking) => {
    const images = getSafeProblemImages(booking);
    if (images.length === 0) return null;

    return (
      <div className="mt-3 rounded-lg border border-base-300 bg-base-200/40 p-3">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide opacity-70">
          Reported Problem Images ({images.length}/5)
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {images.map((img, index) => (
            <button
              key={`${booking._id}-problem-${index}`}
              type="button"
              onClick={() => setPreviewImage(img)}
              className="group relative overflow-hidden rounded-lg border border-base-300 bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label={`Open problem image ${index + 1}`}
            >
              <img
                src={getThumbnailUrl(img)}
                alt={`${booking.serviceName || "Booking"} problem ${index + 1}`}
                className="h-28 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const activeJobs = bookings.filter((b) => b.status === "Active").length;
  const pendingJobs = bookings.filter((b) =>
    b.status.includes("Pending"),
  ).length;
  const totalEarnings = user?.walletBalance || 0;

  // Calculate pending withdrawals to determine truly available balance
  const pendingWithdrawalsTotal = withdrawalHistory
    .filter((w) => w.status === "Pending")
    .reduce((sum, w) => sum + (w.amount || 0), 0);
  const availableBalance = totalEarnings - pendingWithdrawalsTotal;

  // Separate regular and heavy duty bookings
  const heavyDutyBookings = bookings.filter(
    (b) => b.bookingType === "heavy-duty-construction",
  );
  const regularBookings = bookings.filter(
    (b) => b.bookingType !== "heavy-duty-construction",
  );

  if (isLoading) {
    return <PageLoader isLoading={true} message="Loading workspace..." />;
  }

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

        {/* WALLET & WITHDRAWAL SECTION */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Wallet Balance Info */}
            <div>
              <p className="text-sm font-bold uppercase opacity-80 tracking-wide">
                Wallet Balance
              </p>
              <p className="text-4xl font-extrabold mt-1">
                Rs. {totalEarnings.toLocaleString()}
              </p>
              {pendingWithdrawalsTotal > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm opacity-80">
                    Pending Withdrawal: Rs.{" "}
                    {pendingWithdrawalsTotal.toLocaleString()}
                  </p>
                  <p className="text-sm font-bold">
                    Available: Rs. {availableBalance.toLocaleString()}
                  </p>
                </div>
              )}
              {pendingWithdrawalsTotal === 0 && totalEarnings > 0 && (
                <p className="text-sm opacity-80 mt-1">
                  Funds ready for withdrawal
                </p>
              )}
              {totalEarnings === 0 && (
                <p className="text-sm opacity-70 mt-1">
                  Complete jobs to start earning
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {availableBalance > 0 ? (
                <Link
                  to="/withdrawal-request"
                  className="btn btn-lg bg-white text-emerald-700 hover:bg-emerald-50 border-0 shadow-md gap-2 font-bold animate-pulse hover:animate-none w-full md:w-auto"
                >
                  <DollarSign size={22} /> Withdraw Funds
                </Link>
              ) : (
                <button
                  disabled
                  className="btn btn-lg bg-white/20 text-white/60 border-0 gap-2 font-bold cursor-not-allowed w-full md:w-auto"
                >
                  <DollarSign size={22} />{" "}
                  {pendingWithdrawalsTotal > 0
                    ? "Withdrawal Pending"
                    : "No Funds to Withdraw"}
                </button>
              )}

              <button
                onClick={() => setShowHistory((prev) => !prev)}
                className="btn btn-outline btn-lg border-white/40 text-white hover:bg-white/10 hover:border-white gap-2 w-full md:w-auto"
              >
                <History size={18} /> {showHistory ? "Hide" : "View"} History
              </button>
            </div>
          </div>
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
        <div className="space-y-6">
          {/* Show "No jobs" message if no bookings at all */}
          {bookings.length === 0 ? (
            <div className="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-base-300">
              <Briefcase size={48} className="mx-auto text-base-300 mb-4" />
              <h3 className="text-lg font-bold opacity-50">No jobs found</h3>
              <p className="text-sm opacity-40 mt-2">
                Your job requests will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Heavy Duty Construction Jobs */}
              {heavyDutyBookings.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-warning">
                    <Hammer size={20} /> Heavy Duty Construction Requests
                  </h2>
                  <div className="space-y-4">
                    {heavyDutyBookings.map((b) => (
                      <div
                        key={b._id}
                        id={`booking-card-${b._id}`}
                        className="card md:card-side bg-base-100 shadow-sm border-2 border-warning/30 hover:shadow-lg hover:border-warning transition-all duration-200 group"
                      >
                        <div className="card-body p-6">
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            {/* Job Info */}
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between md:justify-start gap-3">
                                <h3 className="card-title text-lg font-bold text-warning group-hover:translate-x-1 transition-transform duration-200">
                                  {b.serviceName}
                                  {b.isCustomJob && (
                                    <span className="badge badge-sm badge-info ml-2">
                                      Custom
                                    </span>
                                  )}
                                </h3>
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
                                  <User size={14} className="text-warning" />
                                  <span className="font-bold">
                                    Client:
                                  </span>{" "}
                                  {b.user?.fullName}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar
                                    size={14}
                                    className="text-warning"
                                  />
                                  <span className="font-bold">Start Date:</span>{" "}
                                  {new Date(
                                    b.scheduledDate,
                                  ).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar
                                    size={14}
                                    className="text-warning"
                                  />
                                  <span className="font-bold">End Date:</span>{" "}
                                  {new Date(b.endDate).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-warning" />
                                  <span className="font-bold">
                                    Total Duration:
                                  </span>{" "}
                                  {Math.ceil(
                                    (new Date(b.endDate) -
                                      new Date(b.scheduledDate)) /
                                      (1000 * 60 * 60 * 24),
                                  )}{" "}
                                  days
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign
                                    size={14}
                                    className="text-warning"
                                  />
                                  <span className="font-bold">
                                    Total Budget:
                                  </span>{" "}
                                  Rs. {b.totalPrice?.toLocaleString()}
                                </div>
                                {b.paymentSchedule &&
                                  b.paymentSchedule.length > 0 && (
                                    <>
                                      <div className="col-span-2 flex items-center gap-2">
                                        <CreditCard
                                          size={14}
                                          className="text-warning"
                                        />
                                        <span className="font-bold">
                                          Payment Plan:
                                        </span>{" "}
                                        {b.paymentSchedule.length} installments
                                      </div>

                                      {/* Payment Schedule Breakdown for New Requests */}
                                      {b.status ===
                                        "Pending_Contractor_Approval" && (
                                        <div className="col-span-2 mt-2">
                                          <div className="bg-base-100 p-3 rounded-lg border border-base-300">
                                            <div className="text-xs font-bold uppercase opacity-60 mb-2 text-center">
                                              Payment Milestones
                                            </div>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                              {b.paymentSchedule.map(
                                                (milestone, idx) => {
                                                  // Calculate startDay and endDay
                                                  let startDay, endDay;
                                                  if (
                                                    milestone.startDay &&
                                                    milestone.endDay
                                                  ) {
                                                    startDay =
                                                      milestone.startDay;
                                                    endDay = milestone.endDay;
                                                  } else {
                                                    // Fallback calculation
                                                    if (idx === 0) {
                                                      startDay = 1;
                                                      endDay =
                                                        milestone.daysCompleted ||
                                                        2;
                                                    } else {
                                                      const prevMilestone =
                                                        b.paymentSchedule[
                                                          idx - 1
                                                        ];
                                                      const prevDaysCompleted =
                                                        prevMilestone.daysCompleted ||
                                                        0;
                                                      startDay =
                                                        prevDaysCompleted + 1;
                                                      endDay =
                                                        milestone.daysCompleted ||
                                                        prevDaysCompleted + 2;
                                                    }
                                                  }

                                                  return (
                                                    <div
                                                      key={idx}
                                                      className="flex justify-between items-center bg-base-200 px-3 py-2 rounded text-xs"
                                                    >
                                                      <div>
                                                        <span className="font-semibold">
                                                          Payment #{idx + 1}
                                                        </span>
                                                        <span className="opacity-70 ml-2">
                                                          {startDay === endDay
                                                            ? `Day ${startDay}`
                                                            : `Days ${startDay} & ${endDay}`}
                                                        </span>
                                                      </div>
                                                      <div className="badge badge-success badge-sm">
                                                        Rs.{" "}
                                                        {milestone.amount?.toLocaleString()}
                                                      </div>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Milestone Progress Indicator */}
                                      {(b.status === "Active" ||
                                        b.status === "Payment_Pending" ||
                                        b.status ===
                                          "Verification_Pending") && (
                                        <div className="col-span-2 mt-2 space-y-3">
                                          {/* Visual Progress Tracker */}
                                          <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                                            <div className="text-xs font-bold uppercase opacity-60 mb-3 text-center">
                                              Overall Progress
                                            </div>
                                            <div className="flex items-center justify-between relative px-2">
                                              {/* Progress Line */}
                                              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-base-300 -translate-y-1/2" />
                                              <div
                                                className="absolute left-0 top-1/2 h-0.5 bg-success -translate-y-1/2 transition-all duration-500"
                                                style={{
                                                  width: `${((b.currentMilestone || 0) / (b.paymentSchedule.length - 1)) * 100}%`,
                                                }}
                                              />

                                              {/* Milestone Dots */}
                                              {b.paymentSchedule.map(
                                                (milestone, idx) => {
                                                  const isCompleted =
                                                    !!milestone.completedAt;
                                                  const isPaid =
                                                    milestone.status === "paid";
                                                  const isPending =
                                                    milestone.status ===
                                                    "pending";
                                                  const isCurrent =
                                                    idx ===
                                                    (b.currentMilestone || 0);
                                                  const isInProgress =
                                                    isCurrent &&
                                                    isPaid &&
                                                    !isCompleted;

                                                  return (
                                                    <div
                                                      key={idx}
                                                      className="relative flex flex-col items-center z-10"
                                                    >
                                                      <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                                                          isCompleted
                                                            ? "bg-success text-white shadow-lg scale-110"
                                                            : isInProgress
                                                              ? "bg-primary text-white shadow-md ring-2 ring-primary ring-offset-2"
                                                              : isPending
                                                                ? "bg-info text-white shadow-md animate-bounce"
                                                                : "bg-base-300 text-base-content"
                                                        }`}
                                                      >
                                                        {isCompleted ? (
                                                          <CheckCircle
                                                            size={20}
                                                          />
                                                        ) : (
                                                          idx + 1
                                                        )}
                                                      </div>
                                                      <div
                                                        className={`text-[10px] font-semibold mt-1.5 ${
                                                          isCompleted
                                                            ? "text-success"
                                                            : isInProgress
                                                              ? "text-primary"
                                                              : isPending
                                                                ? "text-info"
                                                                : "opacity-60"
                                                        }`}
                                                      >
                                                        {isCompleted
                                                          ? "Milestone Complete"
                                                          : isInProgress
                                                            ? "In Progress"
                                                            : `M${idx + 1}`}
                                                      </div>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </div>

                                          <div className="bg-gradient-to-br from-warning/20 to-primary/20 p-4 rounded-lg border-2 border-warning/40">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="text-sm font-bold text-warning">
                                                🏗️ Current Milestone
                                              </div>
                                              <div
                                                className={`badge badge-lg font-bold ${
                                                  b.status === "Payment_Pending"
                                                    ? "badge-warning"
                                                    : b.status ===
                                                        "Verification_Pending"
                                                      ? "badge-info"
                                                      : "badge-warning"
                                                }`}
                                              >
                                                {(b.currentMilestone || 0) + 1}/
                                                {b.paymentSchedule.length}
                                              </div>
                                            </div>

                                            {/* Current Milestone Details */}
                                            {(() => {
                                              const currentIdx =
                                                b.currentMilestone || 0;
                                              const milestone =
                                                b.paymentSchedule[currentIdx];
                                              if (!milestone) return null;

                                              const isCompleted =
                                                !!milestone.completedAt;
                                              const isPaid =
                                                milestone.status === "paid";
                                              const isPending =
                                                milestone.status === "pending";
                                              const isInProgress =
                                                isPaid && !isCompleted;

                                              // Calculate incremental days for this milestone
                                              const prevMilestone =
                                                currentIdx > 0
                                                  ? b.paymentSchedule[
                                                      currentIdx - 1
                                                    ]
                                                  : null;
                                              const incrementalDays =
                                                currentIdx === 0
                                                  ? milestone.daysCompleted
                                                  : milestone.daysCompleted -
                                                    (prevMilestone?.daysCompleted ||
                                                      0);

                                              return (
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                  <div className="bg-base-100 p-2 rounded">
                                                    <div className="opacity-60 font-semibold">
                                                      Days Required
                                                    </div>
                                                    <div className="font-bold text-warning">
                                                      {incrementalDays} days
                                                    </div>
                                                  </div>
                                                  <div className="bg-base-100 p-2 rounded">
                                                    <div className="opacity-60 font-semibold">
                                                      Payment
                                                    </div>
                                                    <div className="font-bold text-success">
                                                      Rs. {milestone.amount}
                                                    </div>
                                                  </div>
                                                  <div className="col-span-2 bg-base-100 p-2 rounded">
                                                    <div className="opacity-60 font-semibold mb-1">
                                                      Status
                                                    </div>
                                                    <div
                                                      className={`font-bold ${
                                                        isCompleted
                                                          ? "text-success"
                                                          : isInProgress
                                                            ? "text-primary"
                                                            : isPending
                                                              ? "text-info"
                                                              : b.status ===
                                                                  "Payment_Pending"
                                                                ? "text-warning"
                                                                : b.status ===
                                                                    "Verification_Pending"
                                                                  ? "text-info"
                                                                  : "text-warning"
                                                      }`}
                                                    >
                                                      {isCompleted
                                                        ? "✅ Milestone Complete"
                                                        : isInProgress
                                                          ? "🔧 In Progress"
                                                          : isPending
                                                            ? "⏳ Waiting for client approval"
                                                            : b.status ===
                                                                "Payment_Pending"
                                                              ? "💰 Waiting for payment"
                                                              : b.status ===
                                                                  "Verification_Pending"
                                                                ? "⏳ Payment verification"
                                                                : "🔧 In Progress"}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                              </div>

                              {renderJobReview(b)}

                              {/* Area - Always visible */}
                              {b.clientArea && (
                                <div className="mt-3 flex items-center gap-2 text-sm">
                                  <MapPin size={16} className="text-warning" />
                                  <span className="font-bold text-warning">
                                    Area:
                                  </span>{" "}
                                  <span className="opacity-90">
                                    {b.clientArea}
                                  </span>
                                </div>
                              )}

                              {/* Project Description - Always visible for heavy duty */}
                              {b.description && (
                                <div className="mt-3 bg-base-200 rounded-lg p-4">
                                  <div className="flex items-start gap-2 mb-2">
                                    <span className="font-bold text-warning flex items-center gap-2">
                                      📋 Project Description:
                                    </span>
                                  </div>
                                  <p className="text-sm opacity-90 whitespace-pre-wrap leading-relaxed">
                                    {b.description}
                                  </p>
                                </div>
                              )}

                              {renderProblemImages(b)}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-sm opacity-80 group-hover:opacity-100 transition-opacity duration-200">
                                {/* Phone & Address - Only after payment approved by admin */}
                                {(b.paymentStatus === "Held" ||
                                  b.paymentStatus === "Completed") &&
                                b.clientPhone &&
                                b.clientAddress ? (
                                  <>
                                    <div className="col-span-2 divider divider-warning my-2"></div>
                                    <div className="flex items-center gap-2">
                                      <Phone
                                        size={14}
                                        className="text-success"
                                      />
                                      <span className="font-bold">Phone:</span>{" "}
                                      <a
                                        href={`tel:${b.clientPhone}`}
                                        className="link link-success"
                                      >
                                        {b.clientPhone}
                                      </a>
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                      <MapPin
                                        size={14}
                                        className="text-success"
                                      />
                                      <span className="font-bold">
                                        Complete Address:
                                      </span>{" "}
                                      {b.clientAddress}
                                    </div>
                                  </>
                                ) : (
                                  <div className="col-span-2 mt-2">
                                    <div className="alert alert-warning shadow-sm py-2">
                                      <AlertTriangle size={14} />
                                      <span className="text-xs">
                                        📱 Complete address and phone number
                                        will be shown after payment approved by
                                        admin
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col justify-center gap-2 min-w-[140px]">
                              {b.status === "Pending_Contractor_Approval" && (
                                <>
                                  {/* Countdown Timer for Acceptance */}
                                  {b.acceptanceExpiresAt ? (
                                    <div className="mb-2">
                                      <CountdownTimer
                                        endTime={b.acceptanceExpiresAt}
                                        label="Respond Within"
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-xs bg-warning/20 p-2 rounded border border-warning/50 text-center mb-2">
                                      ⚠️ Old booking (no timer)
                                    </div>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(b._id, "Accepted")
                                    }
                                    className="btn btn-success btn-sm shadow-lg hover:scale-105 transition-transform"
                                  >
                                    <CheckCircle size={16} /> Accept
                                  </button>
                                  <button
                                    onClick={() => handleNegotiate(b)}
                                    className="btn btn-info btn-sm shadow-lg hover:scale-105 transition-transform gap-1"
                                  >
                                    <MessageCircle size={14} />
                                    Negotiate
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateStatus(b._id, "Rejected")
                                    }
                                    className="btn btn-error btn-sm hover:scale-105 transition-transform"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {b.status === "Active" && (
                                <div className="w-full space-y-2">
                                  {/* Milestone Progress Tracker */}
                                  {b.paymentSchedule &&
                                    b.paymentSchedule.length > 1 && (
                                      <div className="bg-base-200/50 p-3 rounded-lg border border-base-300">
                                        <div className="text-xs font-bold uppercase opacity-60 mb-3 text-center">
                                          Milestone Progress
                                        </div>
                                        <div className="flex items-center justify-between relative px-2">
                                          {/* Progress Line */}
                                          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-base-300 -translate-y-1/2" />
                                          <div
                                            className="absolute left-0 top-1/2 h-0.5 bg-success -translate-y-1/2 transition-all duration-500"
                                            style={{
                                              width: `${((b.currentMilestone || 0) / (b.paymentSchedule.length - 1)) * 100}%`,
                                            }}
                                          />

                                          {/* Milestone Dots */}
                                          {b.paymentSchedule.map(
                                            (milestone, idx) => {
                                              const isCompleted =
                                                !!milestone.completedAt;
                                              const isPaid =
                                                milestone.status === "paid";
                                              const isPending =
                                                milestone.status === "pending";
                                              const isCurrent =
                                                idx ===
                                                (b.currentMilestone || 0);
                                              const isInProgress =
                                                isCurrent &&
                                                isPaid &&
                                                !isCompleted;

                                              return (
                                                <div
                                                  key={idx}
                                                  className="relative flex flex-col items-center z-10"
                                                >
                                                  {/* Dot */}
                                                  <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                                      isCompleted
                                                        ? "bg-success text-white shadow-lg scale-110 animate-pulse"
                                                        : isInProgress
                                                          ? "bg-primary text-white shadow-md"
                                                          : isPending
                                                            ? "bg-info text-white shadow-md animate-bounce"
                                                            : "bg-base-300 text-base-content"
                                                    }`}
                                                  >
                                                    {isCompleted ? (
                                                      <CheckCircle
                                                        size={18}
                                                        className="animate-in zoom-in duration-300"
                                                      />
                                                    ) : (
                                                      idx + 1
                                                    )}
                                                  </div>

                                                  {/* Label */}
                                                  <div
                                                    className={`text-[10px] font-semibold mt-1 whitespace-nowrap ${
                                                      isCompleted
                                                        ? "text-success"
                                                        : isInProgress
                                                          ? "text-primary"
                                                          : isPending
                                                            ? "text-info"
                                                            : "opacity-60"
                                                    }`}
                                                  >
                                                    {isCompleted
                                                      ? "Milestone Complete"
                                                      : isInProgress
                                                        ? "In Progress"
                                                        : `M${idx + 1}`}
                                                  </div>
                                                </div>
                                              );
                                            },
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {(() => {
                                    const currentMilestoneIndex =
                                      b.currentMilestone || 0;
                                    const milestoneDeadline =
                                      getExactMilestoneDeadline(b);
                                    const currentMilestone =
                                      b.paymentSchedule?.[
                                        currentMilestoneIndex
                                      ];

                                    // Check if current milestone is pending approval
                                    // "paid" + completedAt means contractor finished work & awaiting client satisfaction
                                    // "paid" without completedAt means milestone is active & contractor should be working
                                    const isPendingApproval =
                                      currentMilestone?.status === "paid" &&
                                      currentMilestone?.completedAt;

                                    const isLastMilestone =
                                      currentMilestoneIndex ===
                                      b.paymentSchedule.length - 1;

                                    if (isPendingApproval) {
                                      return (
                                        <div className="text-xs bg-info/20 p-3 rounded border border-info/50 text-center font-semibold">
                                          ⏳ Milestone{" "}
                                          {currentMilestoneIndex + 1} submitted.
                                          Waiting for client approval{" "}
                                          {isLastMilestone
                                            ? "to release final payment."
                                            : "to start next phase."}
                                        </div>
                                      );
                                    }

                                    if (milestoneDeadline) {
                                      return (
                                        <CountdownTimer
                                          endTime={milestoneDeadline}
                                          progressStartTime={
                                            currentMilestone?.milestoneStartDate
                                          }
                                          showMilestoneJourney={
                                            (b.paymentSchedule?.length || 0) > 1
                                          }
                                          label={`Milestone ${currentMilestoneIndex + 1} Proof Deadline`}
                                        />
                                      );
                                    }

                                    return (
                                      <div className="text-xs bg-warning/20 p-2 rounded border border-warning/50 text-center font-semibold">
                                        Milestone timer unavailable
                                      </div>
                                    );
                                  })()}

                                  {/* Only show Mark Complete button if current milestone is not pending */}
                                  {(() => {
                                    const currentMilestoneIndex =
                                      b.currentMilestone || 0;
                                    const currentMilestone =
                                      b.paymentSchedule?.[
                                        currentMilestoneIndex
                                      ];
                                    // Only hide Mark Complete if contractor already submitted proof (completedAt set)
                                    const isPendingApproval =
                                      currentMilestone?.status === "paid" &&
                                      currentMilestone?.completedAt;

                                    if (!isPendingApproval) {
                                      return (
                                        <button
                                          onClick={() => setCompleteJob(b)}
                                          className="btn btn-primary btn-sm w-full shadow-lg hover:scale-105 transition-transform"
                                        >
                                          Mark Complete
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                              {b.status === "Payment_Pending" && (
                                <div className="w-full space-y-2">
                                  {/* Milestone Progress Tracker */}
                                  {b.paymentSchedule &&
                                    b.paymentSchedule.length > 1 && (
                                      <div className="bg-base-200/50 p-3 rounded-lg border border-base-300">
                                        <div className="text-xs font-bold uppercase opacity-60 mb-3 text-center">
                                          Milestone Progress
                                        </div>
                                        <div className="flex items-center justify-between relative px-2">
                                          {/* Progress Line */}
                                          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-base-300 -translate-y-1/2" />
                                          <div
                                            className="absolute left-0 top-1/2 h-0.5 bg-success -translate-y-1/2 transition-all duration-500"
                                            style={{
                                              width: `${((b.currentMilestone || 0) / (b.paymentSchedule.length - 1)) * 100}%`,
                                            }}
                                          />

                                          {/* Milestone Dots */}
                                          {b.paymentSchedule.map(
                                            (milestone, idx) => {
                                              const isCompleted =
                                                !!milestone.completedAt;
                                              const isPaid =
                                                milestone.status === "paid";
                                              const isCurrent =
                                                idx ===
                                                (b.currentMilestone || 0);
                                              const isInProgress =
                                                isCurrent &&
                                                isPaid &&
                                                !isCompleted;

                                              return (
                                                <div
                                                  key={idx}
                                                  className="relative flex flex-col items-center z-10"
                                                >
                                                  <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                                      isCompleted
                                                        ? "bg-success text-white shadow-lg scale-110"
                                                        : isInProgress
                                                          ? "bg-warning text-white shadow-md animate-pulse"
                                                          : "bg-base-300 text-base-content"
                                                    }`}
                                                  >
                                                    {isCompleted ? (
                                                      <CheckCircle size={18} />
                                                    ) : (
                                                      idx + 1
                                                    )}
                                                  </div>
                                                  <div
                                                    className={`text-[10px] font-semibold mt-1 whitespace-nowrap ${
                                                      isCompleted
                                                        ? "text-success"
                                                        : isInProgress
                                                          ? "text-warning"
                                                          : "opacity-60"
                                                    }`}
                                                  >
                                                    {isCompleted
                                                      ? "Milestone Complete"
                                                      : isInProgress
                                                        ? "In Progress"
                                                        : `M${idx + 1}`}
                                                  </div>
                                                </div>
                                              );
                                            },
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  <div className="bg-warning/10 p-3 rounded-lg border border-warning/40 space-y-2">
                                    <div className="text-xs font-bold uppercase opacity-70 text-center text-warning">
                                      ✅ Milestone Approved
                                    </div>
                                    <div className="text-sm text-center font-semibold">
                                      💰 Waiting for client payment
                                    </div>
                                    <div className="text-xs text-center opacity-70">
                                      Next milestone timer starts after payment
                                      verification
                                    </div>
                                  </div>
                                </div>
                              )}
                              {b.status === "Verification_Pending" && (
                                <div className="w-full space-y-2">
                                  {/* Milestone Progress Tracker */}
                                  {b.paymentSchedule &&
                                    b.paymentSchedule.length > 1 && (
                                      <div className="bg-base-200/50 p-3 rounded-lg border border-base-300">
                                        <div className="text-xs font-bold uppercase opacity-60 mb-3 text-center">
                                          Milestone Progress
                                        </div>
                                        <div className="flex items-center justify-between relative px-2">
                                          {/* Progress Line */}
                                          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-base-300 -translate-y-1/2" />
                                          <div
                                            className="absolute left-0 top-1/2 h-0.5 bg-success -translate-y-1/2 transition-all duration-500"
                                            style={{
                                              width: `${((b.currentMilestone || 0) / (b.paymentSchedule.length - 1)) * 100}%`,
                                            }}
                                          />

                                          {/* Milestone Dots */}
                                          {b.paymentSchedule.map(
                                            (milestone, idx) => {
                                              const isCompleted =
                                                !!milestone.completedAt;
                                              const isPaid =
                                                milestone.status === "paid";
                                              const isCurrent =
                                                idx ===
                                                (b.currentMilestone || 0);
                                              const isInProgress =
                                                isCurrent &&
                                                isPaid &&
                                                !isCompleted;

                                              return (
                                                <div
                                                  key={idx}
                                                  className="relative flex flex-col items-center z-10"
                                                >
                                                  <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                                      isCompleted
                                                        ? "bg-success text-white shadow-lg scale-110"
                                                        : isInProgress
                                                          ? "bg-info text-white shadow-md animate-pulse"
                                                          : "bg-base-300 text-base-content"
                                                    }`}
                                                  >
                                                    {isCompleted ? (
                                                      <CheckCircle size={18} />
                                                    ) : (
                                                      idx + 1
                                                    )}
                                                  </div>
                                                  <div
                                                    className={`text-[10px] font-semibold mt-1 whitespace-nowrap ${
                                                      isCompleted
                                                        ? "text-success"
                                                        : isInProgress
                                                          ? "text-info"
                                                          : "opacity-60"
                                                    }`}
                                                  >
                                                    {isCompleted
                                                      ? "Milestone Complete"
                                                      : isInProgress
                                                        ? "In Progress"
                                                        : `M${idx + 1}`}
                                                  </div>
                                                </div>
                                              );
                                            },
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  <div className="bg-info/10 p-3 rounded-lg border border-info/40 space-y-2">
                                    <div className="text-xs font-bold uppercase opacity-70 text-center text-info">
                                      ⏳ Payment Verification
                                    </div>
                                    <div className="text-sm text-center font-semibold">
                                      Admin verifying payment
                                    </div>
                                    <div className="text-xs text-center opacity-70">
                                      Work starts after approval
                                    </div>
                                  </div>
                                </div>
                              )}
                              {b.status === "Disputed" && (
                                <div className="w-full">
                                  {/* Display Dispute Decision if exists */}
                                  {b.dispute && (
                                    <div className="mb-3">
                                      <DisputeDecisionCard
                                        dispute={b.dispute}
                                      />
                                    </div>
                                  )}
                                  <Link
                                    to="/dashboard/disputes"
                                    className="btn btn-error btn-sm w-full text-white animate-pulse hover:no-animation font-semibold shadow-lg transition-all duration-200 gap-2"
                                  >
                                    <AlertTriangle size={16} /> View & Respond
                                    to Dispute
                                  </Link>
                                  <div className="text-xs text-center opacity-70 mt-2 p-2 bg-error/10 rounded border border-error/30">
                                    ⚠️ Milestone disputed by client. Submit your
                                    defense to resolve.
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Jobs */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Hammer size={20} /> Regular Jobs
                </h2>

                {regularBookings.length === 0 ? (
                  <div className="text-center py-20 bg-base-100 rounded-2xl border border-dashed border-base-300">
                    <Briefcase
                      size={48}
                      className="mx-auto text-base-300 mb-4"
                    />
                    <h3 className="text-lg font-bold opacity-50">
                      No regular jobs found
                    </h3>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {regularBookings.map((b) => (
                      <div
                        key={b._id}
                        id={`booking-card-${b._id}`}
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
                                  <span className="font-bold">
                                    Client:
                                  </span>{" "}
                                  {b.user?.fullName || "Unknown"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar
                                    size={14}
                                    className="text-primary"
                                  />
                                  <span className="font-bold">Date:</span>{" "}
                                  {new Date(
                                    b.scheduledDate,
                                  ).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-primary" />
                                  <span className="font-bold">Start:</span>{" "}
                                  {b.booking_start_time
                                    ? (() => {
                                        const [h, m] = b.booking_start_time
                                          .split(":")
                                          .map(Number);
                                        const period = h >= 12 ? "PM" : "AM";
                                        const hour12 = h % 12 || 12;
                                        return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
                                      })()
                                    : "—"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-primary" />
                                  <span className="font-bold">End:</span>{" "}
                                  {b.booking_end_time
                                    ? new Date(
                                        b.booking_end_time,
                                      ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })
                                    : "—"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-primary" />
                                  <span className="font-bold">
                                    Duration:
                                  </span>{" "}
                                  {b.totalDuration
                                    ? `${b.totalDuration} hour${
                                        b.totalDuration !== 1 ? "s" : ""
                                      }`
                                    : b.bookingHours
                                      ? `${b.bookingHours} hrs`
                                      : "—"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <CreditCard
                                    size={14}
                                    className="text-primary"
                                  />
                                  <span className="font-bold">Total:</span> Rs.{" "}
                                  {b.totalPrice.toLocaleString()}
                                </div>

                                {/* Show Location before job is active, Address after payment verified */}
                                {b.phoneNumbersVisible
                                  ? // Show full Address when payment is verified
                                    b.user?.address && (
                                      <div className="flex items-center gap-2 md:col-span-2">
                                        <MapPin
                                          size={14}
                                          className="text-success"
                                        />
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
                                        <MapPin
                                          size={14}
                                          className="text-primary"
                                        />
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
                                    <span className="font-bold">
                                      Phone:
                                    </span>{" "}
                                    <span className="text-success font-semibold">
                                      {b.user.phone}
                                    </span>
                                  </div>
                                )}

                                {/* Show locked message when payment not yet verified */}
                                {!b.phoneNumbersVisible &&
                                  (b.status === "Verification_Pending" ||
                                    b.status === "Payment_Pending" ||
                                    b.status ===
                                      "Pending_Contractor_Approval") && (
                                    <div className="flex items-center gap-2 md:col-span-2">
                                      <AlertTriangle
                                        size={14}
                                        className="text-warning"
                                      />
                                      <span className="text-xs opacity-60">
                                        Phone number and full address will show
                                        after admin verifies payment
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

                              {renderProblemImages(b)}

                              {renderJobReview(b)}
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
                                    endTime={
                                      b.completedBy || b.booking_end_time
                                    }
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
            </>
          )}
        </div>

        {/* WITHDRAWAL HISTORY SECTION */}
        <div id="contractor-withdrawal-history">
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

      <ImagePreviewModal
        imageUrl={previewImage}
        alt="Withdrawal proof"
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
};

export default ContractorDashboard;
