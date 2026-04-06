import { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import PaymentModal from "../components/PaymentModal";
import ReviewModal from "../components/ReviewModal";
import PageLoader from "../components/PageLoader";
import CountdownTimer from "../components/CountdownTimer";
import DisputeDecisionCard from "../components/DisputeDecisionCard";
import ImagePreviewModal from "../components/ImagePreviewModal";
import UserMessages from "./UserMessages";
import { Link, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Clock,
  Briefcase,
  Filter,
  Calendar,
  Wallet,
  X,
  MessageCircle,
} from "lucide-react";

const UserDashboard = ({ notifState = {} }) => {
  const { user, setUser, getSessionVersion } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [payBooking, setPayBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Review State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewFromSatisfaction, setReviewFromSatisfaction] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // Moved state here

  // Dashboard Tab State
  const [dashboardTab, setDashboardTab] = useState("bookings");

  // Filter State
  const [filterStatus, setFilterStatus] = useState("All");

  // Withdrawal State
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState("");
  const [accountDetails, setAccountDetails] = useState("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const [conversationMetaById, setConversationMetaById] = useState({});

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

  const fetchConversationMeta = async () => {
    try {
      const { data } = await api.get("/messages?summary=true");
      const meta = (Array.isArray(data) ? data : []).reduce((acc, convo) => {
        if (convo?._id) {
          const contractorId =
            typeof convo.contractor === "object"
              ? convo.contractor?._id
              : convo.contractor;

          acc[convo._id] = {
            _id: convo._id,
            contractorId: contractorId || null,
            unreadByCustomer: convo.unreadByCustomer || 0,
            lastMessageSender: convo.lastMessageSender || "",
            lastMessageTime: convo.lastMessageTime || null,
          };
        }
        return acc;
      }, {});
      setConversationMetaById(meta);
    } catch (error) {
      console.error("Failed to fetch conversation metadata:", error);
    }
  };

  useEffect(() => {
    fetchConversationMeta();
    const interval = setInterval(fetchConversationMeta, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle notification navigation - switch tabs and scroll to relevant booking
  useEffect(() => {
    if (!notifState.fromNotification || isLoading) return;

    const category = notifState.notifCategory;
    const bookingId = notifState.bookingId;

    // Ensure we're on bookings tab for booking-related notifications
    if (category !== "message") {
      setDashboardTab("bookings");
      setFilterStatus("All"); // Show all to ensure the booking is visible
    } else {
      setDashboardTab("messages");
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
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-primary", "ring-offset-2");
            setHighlightedBookingId(null);
          }, 3000);
        }
      }, 300);
    }
  }, [notifState, isLoading]);

  useEffect(() => {
    if (!showWithdrawalModal || !user) return;

    const capturedVersion = getSessionVersion();
    const refreshAndAutofill = async () => {
      let latestUser = user;

      try {
        if (user.role === "user") {
          const { data } = await api.get("/users/profile");
          if (!mountedRef.current) return;
          latestUser = { ...user, ...data };
          setUser(latestUser, capturedVersion);
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

  const getContractorIdFromBooking = (booking) =>
    typeof booking?.contractor === "object"
      ? booking.contractor?._id
      : booking?.contractor;

  const getHeavyDutyNegotiationAlert = (booking) => {
    if (booking?.bookingType !== "heavy-duty-construction") return null;
    const contractorId = getContractorIdFromBooking(booking);
    if (!contractorId) return null;

    const finalStatuses = new Set([
      "Cancelled",
      "Completed",
      "Completed_And_Confirmed",
      "Rejected",
      "Incomplete",
    ]);

    if (finalStatuses.has(booking.status)) return null;

    const latestActiveBookingForContractor = bookings
      .filter(
        (item) =>
          item?.bookingType === "heavy-duty-construction" &&
          getContractorIdFromBooking(item) === contractorId &&
          !finalStatuses.has(item.status),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.scheduledDate || 0) -
          new Date(a.createdAt || a.scheduledDate || 0),
      )[0];

    if (!latestActiveBookingForContractor) return null;
    if (latestActiveBookingForContractor._id !== booking._id) return null;

    const matchingConversation = Object.values(conversationMetaById)
      .filter(
        (conversation) =>
          conversation.contractorId === contractorId &&
          conversation.lastMessageSender === "contractor" &&
          conversation.unreadByCustomer > 0,
      )
      .sort(
        (a, b) =>
          new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0),
      )[0];

    return matchingConversation || null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh] w-full overflow-hidden">
        <PageLoader isLoading={true} message="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <>
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
              <Link
                to="/dashboard/earnings"
                className="btn btn-sm btn-outline btn-white text-white w-full border-white/40 hover:bg-white/20 hover:border-white mt-2 gap-1"
              >
                <Clock size={14} /> View Withdrawal & Earning History
              </Link>
            </div>
          </div>
        </div>

        {/* DASHBOARD TABS */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-8 gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {dashboardTab === "bookings" ? (
              <>
                <Filter size={20} className="text-primary" /> Your Bookings
              </>
            ) : (
              <>
                <MessageCircle size={20} className="text-primary" /> Messages
              </>
            )}
          </h2>
          <div className="join gap-1">
            <button
              className={`join-item btn btn-sm transition-all duration-200 ${
                dashboardTab === "bookings"
                  ? "btn-primary shadow-lg"
                  : "btn-outline hover:bg-base-200"
              }`}
              onClick={() => setDashboardTab("bookings")}
            >
              Bookings
            </button>
            <button
              className={`join-item btn btn-sm transition-all duration-200 ${
                dashboardTab === "messages"
                  ? "btn-primary shadow-lg"
                  : "btn-outline hover:bg-base-200"
              }`}
              onClick={() => setDashboardTab("messages")}
            >
              Messages
            </button>
          </div>
        </div>

        {dashboardTab === "bookings" && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="text-sm opacity-70">
              Filter your bookings by status
            </div>
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
        )}

        {dashboardTab === "messages" ? (
          <UserMessages />
        ) : (
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
                  id={`booking-card-${b._id}`}
                  className={`card bg-base-100 shadow-sm border-2 border-base-200 hover:shadow-lg hover:border-primary/40 transition-all duration-200 group cursor-pointer ${getStatusColor(
                    b.status,
                  )} border-l-[6px] ${
                    b.bookingType === "heavy-duty-construction"
                      ? "bg-gradient-to-br from-base-100 to-primary/5 border-primary/30"
                      : ""
                  }`}
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

                        {b.bookingType === "heavy-duty-construction" && (
                          <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold uppercase tracking-wide text-primary">
                                Heavy Duty Construction
                              </div>
                              <div className="badge badge-primary badge-outline text-xs">
                                Milestone Job
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="opacity-60 font-semibold">
                                  Project Start
                                </div>
                                <div className="font-bold">
                                  {new Date(
                                    b.scheduledDate,
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                              <div>
                                <div className="opacity-60 font-semibold">
                                  Project End
                                </div>
                                <div className="font-bold">
                                  {b.endDate
                                    ? new Date(b.endDate).toLocaleDateString()
                                    : "TBD"}
                                </div>
                              </div>
                              <div>
                                <div className="opacity-60 font-semibold">
                                  Total Budget
                                </div>
                                <div className="font-bold text-success">
                                  Rs. {b.totalPrice?.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {b.paymentSchedule &&
                              b.paymentSchedule.length > 0 && (
                                <div className="mt-3 rounded-md bg-base-100 p-2 border border-base-300">
                                  {(() => {
                                    const currentIdx = b.currentMilestone || 0;
                                    const currentMilestone =
                                      b.paymentSchedule[currentIdx];
                                    const nextMilestone =
                                      b.paymentSchedule[currentIdx + 1];

                                    // Calculate incremental days
                                    const prevMilestone =
                                      currentIdx > 0
                                        ? b.paymentSchedule[currentIdx - 1]
                                        : null;
                                    const currentIncrementalDays =
                                      currentIdx === 0
                                        ? currentMilestone?.daysCompleted || 0
                                        : (currentMilestone?.daysCompleted ||
                                            0) -
                                          (prevMilestone?.daysCompleted || 0);

                                    const nextIncrementalDays = nextMilestone
                                      ? nextMilestone.daysCompleted -
                                        (currentMilestone?.daysCompleted || 0)
                                      : 0;

                                    // Calculate day range for current milestone
                                    let currentStartDay, currentEndDay;
                                    if (
                                      currentMilestone?.startDay &&
                                      currentMilestone?.endDay
                                    ) {
                                      currentStartDay =
                                        currentMilestone.startDay;
                                      currentEndDay = currentMilestone.endDay;
                                    } else {
                                      // Fallback calculation
                                      if (currentIdx === 0) {
                                        currentStartDay = 1;
                                        currentEndDay =
                                          currentMilestone?.daysCompleted || 2;
                                      } else {
                                        const prevDaysCompleted =
                                          prevMilestone?.daysCompleted || 0;
                                        currentStartDay = prevDaysCompleted + 1;
                                        currentEndDay =
                                          currentMilestone?.daysCompleted ||
                                          prevDaysCompleted + 2;
                                      }
                                    }

                                    // Calculate day range for next milestone
                                    let nextStartDay, nextEndDay, nextDayRange;
                                    if (nextMilestone) {
                                      if (
                                        nextMilestone.startDay &&
                                        nextMilestone.endDay
                                      ) {
                                        nextStartDay = nextMilestone.startDay;
                                        nextEndDay = nextMilestone.endDay;
                                      } else {
                                        // Fallback calculation
                                        const currentDaysCompleted =
                                          currentMilestone?.daysCompleted || 0;
                                        nextStartDay = currentDaysCompleted + 1;
                                        nextEndDay =
                                          nextMilestone.daysCompleted ||
                                          currentDaysCompleted + 2;
                                      }
                                      nextDayRange =
                                        nextStartDay === nextEndDay
                                          ? `Day ${nextStartDay}`
                                          : `Days ${nextStartDay} & ${nextEndDay}`;
                                    }

                                    return (
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                        <div>
                                          <div className="opacity-60 font-semibold">
                                            Current Milestone
                                          </div>
                                          <div className="font-bold">
                                            {currentIdx + 1}/
                                            {b.paymentSchedule.length}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="opacity-60 font-semibold">
                                            Amount Due
                                          </div>
                                          <div className="font-bold text-primary">
                                            Rs. {currentMilestone?.amount || 0}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="opacity-60 font-semibold">
                                            Work Period
                                          </div>
                                          <div className="font-bold">
                                            {currentStartDay === currentEndDay
                                              ? `Day ${currentStartDay}`
                                              : `Days ${currentStartDay} & ${currentEndDay}`}
                                          </div>
                                        </div>
                                        <div className="md:col-span-2">
                                          <div className="opacity-60 font-semibold">
                                            Next Milestone
                                          </div>
                                          <div className="font-bold">
                                            {nextMilestone
                                              ? `${nextDayRange} - Rs. ${nextMilestone.amount}`
                                              : "Final milestone"}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="opacity-60 font-semibold">
                                            Deadline
                                          </div>
                                          <div className="font-bold">
                                            {currentMilestone?.milestoneDeadline
                                              ? new Date(
                                                  currentMilestone.milestoneDeadline,
                                                ).toLocaleDateString()
                                              : "TBD"}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                            {b.paymentSchedule &&
                              b.paymentSchedule.length > 0 && (
                                <div className="mt-3 rounded-md bg-base-100 p-2 border border-base-300">
                                  <div className="text-xs font-semibold opacity-70 mb-2">
                                    Milestone Timeline
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {b.paymentSchedule.map((milestone, idx) => {
                                      const isPaid =
                                        milestone.status === "paid";
                                      const isCurrent =
                                        idx === (b.currentMilestone || 0);
                                      const dotClass = isPaid
                                        ? "bg-success border-success"
                                        : isCurrent
                                          ? "bg-primary border-primary"
                                          : "bg-base-200 border-base-300";
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2"
                                        >
                                          <div
                                            className={`h-3 w-3 rounded-full border-2 ${dotClass}`}
                                            title={`Milestone ${idx + 1}`}
                                          />
                                          {idx <
                                            b.paymentSchedule.length - 1 && (
                                            <div className="h-[2px] w-8 bg-base-300" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {(() => {
                          const negotiationAlert =
                            getHeavyDutyNegotiationAlert(b);
                          if (!negotiationAlert) return null;

                          return (
                            <div className="mt-3 rounded-lg border border-error/50 bg-error/10 p-3">
                              <div className="text-sm font-bold text-error">
                                Contractor sent you a negotiation message.
                              </div>
                              <p className="text-xs text-error/90 mt-1">
                                Please open chat now. After both sides agree on
                                days and budget, resend this booking request to
                                the same contractor with the agreed values.
                              </p>
                              <button
                                onClick={() =>
                                  navigate("/dashboard/messages", {
                                    state: {
                                      selectConversationId:
                                        negotiationAlert._id,
                                    },
                                  })
                                }
                                className="btn btn-xs btn-error text-white mt-2"
                              >
                                Open Negotiation Chat
                              </button>
                            </div>
                          );
                        })()}

                        {/* Completion Images - Only for regular bookings, not heavy duty */}
                        {b.completionImages &&
                          b.completionImages.length > 0 &&
                          b.bookingType !== "heavy-duty-construction" && (
                            <div className="mt-4 space-y-2">
                              <div className="text-xs font-bold uppercase opacity-60">
                                📸 Completion Proof
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

                        {/* Heavy Duty: Display All Milestone Images */}
                        {b.bookingType === "heavy-duty-construction" &&
                          b.paymentSchedule &&
                          b.paymentSchedule.some(
                            (m) =>
                              m.completionImages &&
                              m.completionImages.length > 0,
                          ) && (
                            <div className="mt-4 space-y-3">
                              <div className="text-xs font-bold uppercase opacity-60">
                                🏗️ All Milestone Photos
                              </div>
                              {b.paymentSchedule.map((milestone, mIdx) => {
                                if (
                                  !milestone.completionImages ||
                                  milestone.completionImages.length === 0
                                )
                                  return null;
                                return (
                                  <div key={mIdx} className="space-y-2">
                                    <div className="text-xs font-semibold text-primary">
                                      Milestone {mIdx + 1}{" "}
                                      {milestone.completedAt && (
                                        <span className="text-success">
                                          ✓ Completed
                                        </span>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                      {milestone.completionImages.map(
                                        (img, imgIdx) => (
                                          <button
                                            key={imgIdx}
                                            type="button"
                                            className="w-full h-20 rounded-lg overflow-hidden border border-primary/30 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                            onClick={() => setPreviewImage(img)}
                                          >
                                            <img
                                              src={img}
                                              alt={`Milestone ${mIdx + 1} - Photo ${imgIdx + 1}`}
                                              className="w-full h-full object-cover"
                                              loading="lazy"
                                            />
                                          </button>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        {/* Display Dispute Decision if exists */}
                        {b.dispute && (
                          <DisputeDecisionCard dispute={b.dispute} />
                        )}

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

                        {b.status === "Rejected" && (
                          <div className="text-xs text-error font-medium mt-2 p-3 bg-error/10 rounded-md border border-error/30">
                            ❌ This contractor rejected your request. Please
                            find another contractor as this one might not be
                            interested in your job request.
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
                            {b.bookingType === "heavy-duty-construction" &&
                              b.paymentSchedule &&
                              b.paymentSchedule.length > 0 && (
                                <div className="text-xs bg-primary/10 p-2 rounded border border-primary/30 text-center font-semibold text-primary">
                                  Milestone {(b.currentMilestone || 0) + 1}/
                                  {b.paymentSchedule.length} payment: Rs.{" "}
                                  {
                                    b.paymentSchedule[b.currentMilestone || 0]
                                      ?.amount
                                  }
                                </div>
                              )}
                            {b.bookingType === "heavy-duty-construction" &&
                              b.status === "Payment_Pending" && (
                                <div className="text-xs bg-info/10 p-2 rounded border border-info/30 text-center font-semibold text-info">
                                  Next payment due by:{" "}
                                  {b.paymentExpiresAt
                                    ? new Date(
                                        b.paymentExpiresAt,
                                      ).toLocaleString()
                                    : "TBD"}
                                </div>
                              )}
                            {b.paymentExpired && (
                              <div className="text-xs bg-error/20 p-2 rounded border border-error/50 text-center font-bold text-error">
                                ❌ PAYMENT EXPIRED - Job Cancelled
                              </div>
                            )}
                            <button
                              onClick={() => setPayBooking(b)}
                              disabled={b.paymentExpired}
                              className={`btn btn-sm w-full font-semibold hover:shadow-lg transition-all duration-200 gap-2 ${
                                b.paymentExpired
                                  ? "btn-disabled"
                                  : "btn-primary"
                              }`}
                            >
                              <CreditCard size={14} />{" "}
                              {b.paymentExpired
                                ? "Payment Expired"
                                : "Pay Now / Upload Proof"}
                            </button>
                          </div>
                        )}

                        {/* Milestone Display for Heavy Duty Construction */}
                        {b.bookingType === "heavy-duty-construction" &&
                          b.paymentSchedule &&
                          b.paymentSchedule.length > 0 &&
                          b.status === "Active" && (
                            <div className="mt-3 space-y-3 bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg border-2 border-primary/30">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-bold text-primary">
                                  🏗️ Project Milestones
                                </div>
                                <div className="badge badge-primary badge-lg font-bold">
                                  Milestone {(b.currentMilestone || 0) + 1}/
                                  {b.paymentSchedule.length}
                                </div>
                              </div>

                              {/* Current Milestone Progress */}
                              <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-500"
                                  style={{
                                    width: `${((b.currentMilestone || 0) / b.paymentSchedule.length) * 100}%`,
                                  }}
                                />
                              </div>

                              {/* Current Milestone Info */}
                              {(() => {
                                const currentIdx = b.currentMilestone || 0;
                                const currentMilestone =
                                  b.paymentSchedule[currentIdx];

                                if (!currentMilestone) return null;

                                const milestoneCompleted =
                                  currentMilestone.completedAt;
                                const milestoneImages =
                                  currentMilestone.completionImages || [];

                                // Calculate incremental days for this milestone
                                const prevMilestone =
                                  currentIdx > 0
                                    ? b.paymentSchedule[currentIdx - 1]
                                    : null;
                                const incrementalDays =
                                  currentIdx === 0
                                    ? currentMilestone.daysCompleted
                                    : currentMilestone.daysCompleted -
                                      (prevMilestone?.daysCompleted || 0);

                                return (
                                  <div className="space-y-3">
                                    <div className="bg-base-100 p-3 rounded-lg border border-base-300">
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <div className="opacity-60 font-semibold">
                                            Days Required
                                          </div>
                                          <div className="font-bold text-primary">
                                            {incrementalDays} days
                                          </div>
                                        </div>
                                        <div>
                                          <div className="opacity-60 font-semibold">
                                            Amount
                                          </div>
                                          <div className="font-bold text-success">
                                            Rs. {currentMilestone.amount}
                                          </div>
                                        </div>
                                        <div className="col-span-2">
                                          <div className="opacity-60 font-semibold">
                                            Status
                                          </div>
                                          <div
                                            className={`font-bold ${
                                              milestoneCompleted
                                                ? "text-success"
                                                : "text-warning"
                                            }`}
                                          >
                                            {milestoneCompleted
                                              ? "✅ Completed - Review Required"
                                              : "🔧 Work in Progress"}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Milestone Completion Images */}
                                    {milestoneCompleted &&
                                      milestoneImages.length > 0 && (
                                        <div className="space-y-2">
                                          <div className="text-xs font-bold uppercase opacity-70">
                                            📸 Milestone Completion Photos
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            {milestoneImages.map((img, idx) => (
                                              <button
                                                key={idx}
                                                type="button"
                                                className="w-full h-20 rounded-lg overflow-hidden border-2 border-primary/30 hover:border-primary transition-all"
                                                onClick={() =>
                                                  setPreviewImage(img)
                                                }
                                              >
                                                <img
                                                  src={img}
                                                  alt={`Milestone ${currentIdx + 1} - Photo ${idx + 1}`}
                                                  className="w-full h-full object-cover"
                                                  loading="lazy"
                                                />
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                    {/* Satisfaction Button for Completed Milestone */}
                                    {milestoneCompleted && (
                                      <div className="space-y-2">
                                        <div className="text-xs bg-info/20 p-2 rounded border border-info/50 text-center">
                                          ⏱️ Review milestone work to release
                                          payment & start next phase
                                        </div>

                                        {/* Satisfaction Countdown Timer */}
                                        {currentMilestone.satisfactionDeadline && (
                                          <div className="bg-warning/10 border border-warning/40 rounded-lg p-3">
                                            <div className="text-xs font-semibold text-warning mb-2 text-center">
                                              ⏰ Auto-Approval Timer
                                            </div>
                                            <CountdownTimer
                                              endTime={
                                                currentMilestone.satisfactionDeadline
                                              }
                                              label="Time Remaining"
                                            />
                                          </div>
                                        )}

                                        <button
                                          onClick={() => handleSatisfied(b)}
                                          className="btn btn-sm btn-success w-full text-white font-semibold hover:shadow-lg transition-all duration-200"
                                        >
                                          ✅ Approve Milestone {currentIdx + 1}
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

                                    {/* Next Milestone Preview */}
                                    {currentIdx <
                                      b.paymentSchedule.length - 1 &&
                                      !milestoneCompleted && (
                                        <div className="text-xs opacity-60 mt-2 p-2 bg-base-200 rounded">
                                          📅 Next Milestone:{" "}
                                          {
                                            b.paymentSchedule[currentIdx + 1]
                                              .daysCompleted
                                          }{" "}
                                          days - Rs.{" "}
                                          {
                                            b.paymentSchedule[currentIdx + 1]
                                              .amount
                                          }
                                        </div>
                                      )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                        {/* Regular Job Completion (non-milestone) */}
                        {b.status === "Completed" &&
                          !(
                            b.bookingType === "heavy-duty-construction" &&
                            b.paymentSchedule &&
                            b.paymentSchedule.length > 0
                          ) && (
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
        )}

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

        <ImagePreviewModal
          imageUrl={previewImage}
          alt="Completion proof"
          onClose={() => setPreviewImage(null)}
        />

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
