import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import useScrollReveal from "../utils/useScrollReveal";
import {
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Briefcase,
  TrendingUp,
  LayoutDashboard,
  Settings,
  X,
  Search,
  Calendar,
  CreditCard,
  Eye,
  AlertTriangle,
  FileText,
  DollarSign,
  MessageCircle,
  Bot,
  Sparkles,
  Clock,
  Shield,
  HardHat,
  Layers,
  ThumbsUp,
  Timer,
  ImageIcon,
  ChevronRight,
  Building2,
  Hammer,
  Camera,
  Wallet,
  Ban,
  CircleDot,
  Banknote,
  Percent,
  Upload,
  HandshakeIcon,
  CircleCheck,
  XCircle,
  Hourglass,
  BadgeCheck,
} from "lucide-react";

const Home = () => {
  const { user } = useContext(AuthContext);
  const [showConstructionModal, setShowConstructionModal] = useState(false);
  const scrollRevealRef = useScrollReveal();

  useEffect(() => {
    if (!showConstructionModal) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    // Prevent background page scroll while modal is open (especially on mobile).
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [showConstructionModal]);

  // Determine contractor type
  const isHeavyDuty =
    user?.role === "contractor" &&
    user?.skill?.toLowerCase()?.includes("heavy duty");

  // --- ADMIN HOMEPAGE VIEW ---
  if (user?.role === "admin") {
    let adminSectionNum = 0;
    const nextAdminSection = () => ++adminSectionNum;

    return (
      <div ref={scrollRevealRef} className="min-h-screen bg-base-100 font-sans">
        {/* Admin Hero */}
        <div className="bg-neutral text-neutral-content py-20 px-6 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80')",
            }}
          ></div>
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-6">
                <div className="badge badge-primary badge-lg font-bold anim-scale-fade">
                  Admin Panel
                </div>
                <h1 className="text-5xl font-bold leading-tight anim-blur-fade anim-delay-200">
                  Welcome back, <br />
                  <span className="text-primary">{user.fullName}</span>
                </h1>
                <p className="text-lg opacity-80 max-w-xl anim-fade-up anim-delay-400">
                  Manage payments, withdrawals, users, contractors, monitor
                  disputes, and oversee platform activity.
                </p>
                <div className="flex flex-wrap gap-4 anim-fade-up anim-delay-500">
                  <Link
                    to="/dashboard"
                    className="btn btn-primary btn-lg shadow-lg gap-2"
                  >
                    <LayoutDashboard size={20} />
                    My Dashboard
                  </Link>
                  <Link
                    to="/dashboard"
                    state={{ adminView: "analytics" }}
                    className="btn btn-accent btn-lg shadow-lg gap-2"
                  >
                    <TrendingUp size={20} /> Analytics
                  </Link>
                  <Link
                    to="/profile"
                    className="btn btn-outline btn-lg text-white gap-2"
                  >
                    <Settings size={20} /> Settings
                  </Link>
                </div>
              </div>
              {/* Decorative Icon */}
              <div className="hidden md:block opacity-10 anim-slide-right anim-delay-300">
                <Shield size={250} />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Quick Actions */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-10 text-center anim-on-scroll">
            Platform Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-colors anim-on-scroll"
              style={{ transitionDelay: "100ms" }}
            >
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <CreditCard size={24} />
                </div>
                <h3 className="card-title">Verify Payments</h3>
                <p className="opacity-70">
                  Review payment screenshots and approve or reject transactions.
                </p>
                <div className="card-actions justify-end mt-4">
                  <Link
                    to="/dashboard"
                    state={{ adminView: "payments" }}
                    className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Go to Payments <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="card bg-base-100 shadow-xl border border-base-200 hover:border-secondary transition-colors anim-on-scroll"
              style={{ transitionDelay: "200ms" }}
            >
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4">
                  <DollarSign size={24} />
                </div>
                <h3 className="card-title">Process Withdrawals</h3>
                <p className="opacity-70">
                  Handle pending withdrawal requests from contractors and users.
                </p>
                <div className="card-actions justify-end mt-4">
                  <Link
                    to="/dashboard"
                    state={{ adminView: "withdrawals" }}
                    className="text-secondary font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Go to Withdrawals <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="card bg-base-100 shadow-xl border border-base-200 hover:border-error transition-colors anim-on-scroll"
              style={{ transitionDelay: "300ms" }}
            >
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center text-error mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="card-title">Resolve Disputes</h3>
                <p className="opacity-70">
                  Review disputes with AI analysis and make fair decisions.
                </p>
                <div className="card-actions justify-end mt-4">
                  <Link
                    to="/dashboard"
                    state={{ adminView: "disputes" }}
                    className="text-error font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Go to Disputes <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================= */}
        {/* ADMIN COMPLETE GUIDE - HOW EVERYTHING WORKS */}
        {/* ============================================= */}
        <div className="py-20 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge badge-primary badge-lg mb-4">Admin Guide</div>
            <h2 className="text-4xl font-bold mb-4">
              How the Admin Panel Works
            </h2>
            <p className="opacity-60 max-w-2xl mx-auto text-lg">
              Your complete guide to managing the BuildLink platform — from
              verifying payments to resolving disputes. Follow these steps to
              keep everything running smoothly.
            </p>
          </div>

          {/* ===== SECTION 1: PAYMENT VERIFICATION ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xl">
                {nextAdminSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Verifying Payment Screenshots
              </h3>
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-3xl">
              When a customer books a contractor, they upload a payment
              screenshot. You need to verify it before the job can start.
            </p>

            <div className="card bg-gradient-to-br from-primary/5 to-base-100 shadow-xl border-2 border-primary/20">
              <div className="card-body">
                <div className="flex flex-col gap-0">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold">
                        1
                      </div>
                      <div className="w-0.5 h-14 bg-primary/30"></div>
                    </div>
                    <div className="pt-2 pb-8">
                      <h5 className="font-bold">You Get Notified</h5>
                      <p className="text-sm opacity-60">
                        When a customer uploads a payment screenshot, you'll
                        receive a notification. Go to the{" "}
                        <strong>Payments</strong> tab.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-info flex items-center justify-center text-info-content font-bold">
                        2
                      </div>
                      <div className="w-0.5 h-14 bg-info/30"></div>
                    </div>
                    <div className="pt-2 pb-8">
                      <h5 className="font-bold flex items-center gap-2">
                        Review the Screenshot{" "}
                        <Eye size={18} className="text-info" />
                      </h5>
                      <p className="text-sm opacity-60">
                        Click on the booking card to view the payment proof.
                        Verify the <strong>amount</strong>,{" "}
                        <strong>date</strong>, and{" "}
                        <strong>recipient account</strong> match your IBAN.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-success flex items-center justify-center text-success-content font-bold">
                        3
                      </div>
                    </div>
                    <div className="pt-2">
                      <h5 className="font-bold">Approve or Reject</h5>
                      <p className="text-sm opacity-60">
                        If the payment is valid, click{" "}
                        <strong>"Approve"</strong> — the job becomes active and
                        the contractor can start work. If the screenshot is
                        fake, blurry, or incorrect, click{" "}
                        <strong>"Reject"</strong> — the customer can re-upload.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="alert alert-info mt-6 max-w-2xl mx-auto shadow-md">
              <Eye size={20} />
              <div>
                <h4 className="font-bold">Heavy Duty Milestone Payments</h4>
                <p className="text-sm">
                  For construction projects, you'll verify payments for{" "}
                  <strong>each milestone</strong> separately. The same
                  approve/reject process applies for every phase.
                </p>
              </div>
            </div>
          </div>

          {/* ===== SECTION 2: BOOKING STATUS OVERVIEW ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-secondary text-secondary-content flex items-center justify-center font-bold text-xl">
                {nextAdminSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Understanding Booking Statuses
              </h3>
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-3xl">
              Each booking on the platform goes through a lifecycle. Here's what
              every status means from the admin perspective:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-base-200 hover:bg-base-300 transition-colors">
                <div className="w-4 h-4 rounded-full bg-base-300 border-2 border-gray-400 mt-1 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-sm">Pending</h4>
                  <p className="text-xs opacity-60">
                    Customer sent a booking request. Waiting for the contractor
                    to accept or reject.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-warning/10 hover:bg-warning/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-warning mt-1 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-sm">Payment Pending</h4>
                  <p className="text-xs opacity-60">
                    Contractor accepted. Customer has <strong>2 hours</strong>{" "}
                    to upload a payment screenshot.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-info/10 hover:bg-info/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-info mt-1 flex-shrink-0 animate-pulse"></div>
                <div>
                  <h4 className="font-bold text-sm">Verification Pending</h4>
                  <p className="text-xs opacity-60">
                    <strong>Action needed!</strong> Customer uploaded payment
                    proof. You must review and approve or reject it.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-success/10 hover:bg-success/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-success mt-1 flex-shrink-0 ring-2 ring-success/50 ring-offset-1"></div>
                <div>
                  <h4 className="font-bold text-sm">Active</h4>
                  <p className="text-xs opacity-60">
                    Payment verified by you. Contractor is doing the work. No
                    admin action needed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-primary mt-1 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-sm">
                    Completed (Pending Review)
                  </h4>
                  <p className="text-xs opacity-60">
                    Contractor submitted proof photos. Customer has{" "}
                    <strong>3 hours</strong> to approve or dispute.
                    Auto-releases if no response.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-error/10 hover:bg-error/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-error mt-1 flex-shrink-0 animate-pulse"></div>
                <div>
                  <h4 className="font-bold text-sm">Disputed</h4>
                  <p className="text-xs opacity-60">
                    <strong>Action needed!</strong> Customer filed a complaint.
                    Payment is frozen. You must resolve it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 3: DISPUTE RESOLUTION ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-error text-error-content flex items-center justify-center font-bold text-xl">
                {nextAdminSection()}
              </div>
              <h3 className="text-2xl font-bold">Resolving Disputes Fairly</h3>
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-3xl">
              When a customer is unhappy with the work, they file a dispute.
              Payment is frozen and you must decide the outcome.
            </p>

            <div className="card bg-gradient-to-br from-error/5 to-base-100 shadow-xl border-2 border-error/20">
              <div className="card-body">
                <div className="flex flex-col gap-0">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-error flex items-center justify-center text-error-content font-bold">
                        1
                      </div>
                      <div className="w-0.5 h-14 bg-error/30"></div>
                    </div>
                    <div className="pt-2 pb-8">
                      <h5 className="font-bold">Review Both Sides</h5>
                      <p className="text-sm opacity-60">
                        Open the dispute to see a{" "}
                        <strong>split-screen view</strong>: the customer's
                        complaint with evidence on one side, and the
                        contractor's defense with proof photos on the other.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-info flex items-center justify-center text-info-content font-bold">
                        2
                      </div>
                      <div className="w-0.5 h-14 bg-info/30"></div>
                    </div>
                    <div className="pt-2 pb-8">
                      <h5 className="font-bold flex items-center gap-2">
                        Use AI Analysis <Bot size={18} className="text-info" />
                      </h5>
                      <p className="text-sm opacity-60">
                        Click <strong>"AI Summary"</strong> for an impartial
                        analysis powered by Gemini AI. It evaluates both
                        positions and recommends a fair resolution.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-warning flex items-center justify-center text-warning-content font-bold">
                        3
                      </div>
                    </div>
                    <div className="pt-2">
                      <h5 className="font-bold">Make Your Decision</h5>
                      <p className="text-sm opacity-60">
                        Choose one of three outcomes: <strong>Release</strong>{" "}
                        payment to contractor, <strong>Refund</strong> to
                        customer, or <strong>Split</strong> it fairly. Both
                        parties are notified automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispute Outcomes */}
            <div className="mt-8 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="card bg-success/10 border-2 border-success/20 shadow-md">
                <div className="card-body items-center text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <h4 className="font-bold text-success">
                    Release to Contractor
                  </h4>
                  <p className="text-xs opacity-60">
                    Customer's complaint is invalid. Contractor gets{" "}
                    <strong>95%</strong> of payment (5% admin commission).
                  </p>
                </div>
              </div>
              <div className="card bg-error/10 border-2 border-error/20 shadow-md">
                <div className="card-body items-center text-center">
                  <div className="text-3xl mb-2">💸</div>
                  <h4 className="font-bold text-error">Refund to Customer</h4>
                  <p className="text-xs opacity-60">
                    Work was not done properly. Customer gets a{" "}
                    <strong>100% refund</strong> to their wallet.
                  </p>
                </div>
              </div>
              <div className="card bg-warning/10 border-2 border-warning/20 shadow-md">
                <div className="card-body items-center text-center">
                  <div className="text-3xl mb-2">⚖️</div>
                  <h4 className="font-bold text-warning">Split Payment</h4>
                  <p className="text-xs opacity-60">
                    Partial work done. Split fairly — <strong>47.5%</strong> to
                    contractor, <strong>47.5%</strong> to customer,{" "}
                    <strong>5%</strong> admin commission.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 4: WITHDRAWAL PROCESSING ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-accent text-accent-content flex items-center justify-center font-bold text-xl">
                {nextAdminSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Processing Withdrawal Requests
              </h3>
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-3xl">
              Contractors and users request withdrawals from their BuildLink
              wallets. You process them by sending the funds and uploading
              proof.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="card bg-gradient-to-br from-accent/10 to-accent/5 shadow-lg border-2 border-accent/20">
                <div className="card-body">
                  <h4 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <Wallet size={20} className="text-accent" /> How to Process
                  </h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        1
                      </div>
                      <p className="text-sm opacity-70 pt-1">
                        Go to <strong>Dashboard → Withdrawals</strong> tab
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        2
                      </div>
                      <p className="text-sm opacity-70 pt-1">
                        View the request details: amount, user name, payment
                        method, and account/IBAN info
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        3
                      </div>
                      <p className="text-sm opacity-70 pt-1">
                        Send the funds to their account, then click{" "}
                        <strong>"Complete"</strong> and{" "}
                        <strong>upload a transaction screenshot</strong> as
                        proof
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        4
                      </div>
                      <p className="text-sm opacity-70 pt-1">
                        Or click <strong>"Reject"</strong> if there's an issue
                        with the request — funds stay in their wallet
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-lg border border-base-300">
                <div className="card-body">
                  <h4 className="font-bold text-lg mb-4">What Happens After</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                      <div className="badge badge-success badge-sm">
                        Completed
                      </div>
                      <p className="text-xs opacity-70">
                        Funds deducted from their wallet. User receives
                        notification with your proof screenshot.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-error/10">
                      <div className="badge badge-error badge-sm">Rejected</div>
                      <p className="text-xs opacity-70">
                        No deduction. User is notified the request was rejected
                        and funds remain in their wallet.
                      </p>
                    </div>
                  </div>
                  <div className="alert alert-warning mt-4">
                    <AlertTriangle size={16} />
                    <span className="text-xs">
                      Always upload <strong>proof of transfer</strong> when
                      completing — this protects you and the platform.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 5: ADMIN COMMISSION ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-info text-info-content flex items-center justify-center font-bold text-xl">
                {nextAdminSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Platform Commission — How Revenue Works
              </h3>
            </div>

            <div className="card bg-gradient-to-r from-info/10 to-success/10 shadow-xl border-2 border-info/20 max-w-3xl mx-auto">
              <div className="card-body">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0 text-center">
                    <div className="relative w-40 h-40">
                      <svg
                        className="w-40 h-40 transform -rotate-90"
                        viewBox="0 0 120 120"
                      >
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="currentColor"
                          className="text-base-300"
                          strokeWidth="20"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="currentColor"
                          className="text-primary"
                          strokeWidth="20"
                          strokeDasharray="298.45"
                          strokeDashoffset="283.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-primary">
                          5%
                        </span>
                        <span className="text-xs opacity-50">Platform Fee</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                      <Percent size={20} className="text-primary" />
                      <div>
                        <h5 className="font-bold text-sm">
                          BuildLink Earns: 5%
                        </h5>
                        <p className="text-xs opacity-60">
                          For a Rs. 10,000 job, the platform keeps{" "}
                          <strong>Rs. 500</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                      <Wallet size={20} className="text-success" />
                      <div>
                        <h5 className="font-bold text-sm">
                          Contractor Gets: 95%
                        </h5>
                        <p className="text-xs opacity-60">
                          Contractor receives <strong>Rs. 9,500</strong> in
                          their wallet after job completion
                        </p>
                      </div>
                    </div>
                    <div className="text-xs opacity-50 mt-2 italic">
                      Commission is deducted automatically when payment is
                      released (on customer satisfaction or auto-release after 3
                      hours).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 6: USER & CONTRACTOR MANAGEMENT ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-neutral text-neutral-content flex items-center justify-center font-bold text-xl">
                {nextAdminSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Managing Users & Contractors
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="card bg-base-100 shadow-lg border-2 border-base-200 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                <div className="card-body">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                    <Users size={28} />
                  </div>
                  <h4 className="font-bold text-lg">Users Tab</h4>
                  <p className="text-sm opacity-70">
                    View all registered homeowners/customers. See their email,
                    join date, and booking history.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-lg border-2 border-base-200 hover:border-secondary/40 transition-all duration-300 hover:-translate-y-1">
                <div className="card-body">
                  <div className="w-14 h-14 rounded-lg bg-secondary/10 flex items-center justify-center mb-3 text-secondary">
                    <HardHat size={28} />
                  </div>
                  <h4 className="font-bold text-lg">Contractors Tab</h4>
                  <p className="text-sm opacity-70">
                    View all registered contractors. See their skills, ratings,
                    availability, and edit their profiles if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 7: ANALYTICS & SETTINGS ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-warning text-warning-content flex items-center justify-center font-bold text-xl">
                {nextAdminSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Analytics & Platform Settings
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="card bg-gradient-to-br from-warning/10 to-base-100 shadow-lg border-2 border-warning/20">
                <div className="card-body">
                  <div className="w-14 h-14 rounded-lg bg-warning/10 flex items-center justify-center mb-3 text-warning">
                    <TrendingUp size={28} />
                  </div>
                  <h4 className="font-bold text-lg">Financial Analytics</h4>
                  <ul className="text-sm opacity-70 space-y-2 mt-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={14}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      Total platform revenue & commission earned
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={14}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      Monthly trends (last 12 months)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={14}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      Top performing service categories
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={14}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      Dispute breakdown by decision type
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={14}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      Export full financial reports as CSV
                    </li>
                  </ul>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-base-200 to-base-100 shadow-lg border-2 border-base-300">
                <div className="card-body">
                  <div className="w-14 h-14 rounded-lg bg-base-300 flex items-center justify-center mb-3">
                    <Settings size={28} />
                  </div>
                  <h4 className="font-bold text-lg">Platform Settings</h4>
                  <ul className="text-sm opacity-70 space-y-2 mt-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={14}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      Set IBAN number for receiving payments
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={14}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      Update bank name & account holder
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={14}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      Company name, email & phone
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={14}
                        className="text-success mt-0.5 flex-shrink-0"
                      />
                      These settings are shown to customers on the payment page
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 8: IMPORTANT TIMERS ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-secondary text-secondary-content flex items-center justify-center font-bold text-xl">
                {nextAdminSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Platform Timers You Should Know
              </h3>
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-3xl">
              BuildLink uses automatic timers to keep things moving. While most
              are handled automatically, knowing them helps you understand why
              bookings change status.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Timer size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Contractor Response</h4>
                      <div className="badge badge-primary badge-xs">1 Hour</div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    Contractor has 1 hour to accept/reject. Auto-cancelled if no
                    response (30 min for emergencies).
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Hourglass size={20} className="text-warning" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Customer Payment</h4>
                      <div className="badge badge-warning badge-xs">
                        2 Hours
                      </div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    After contractor accepts, customer has 2 hours to upload
                    payment screenshot. Auto-cancelled otherwise.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <ThumbsUp size={20} className="text-success" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Auto-Release</h4>
                      <div className="badge badge-success badge-xs">
                        3 Hours
                      </div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    After contractor submits proof, customer has 3 hours to
                    approve or dispute. Payment auto-releases if no action.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-error" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Work Deadline</h4>
                      <div className="badge badge-error badge-xs">Per Job</div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    Each job has a deadline. If missed, the job is marked
                    incomplete and the customer is auto-refunded.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                      <Layers size={20} className="text-info" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Milestone Cycle</h4>
                      <div className="badge badge-info badge-xs">2 Days</div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    Heavy Duty projects have 2-day milestone phases. Each
                    milestone requires a new payment verification from you.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Eye size={20} className="text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Timer Colors</h4>
                      <div className="badge badge-secondary badge-xs">
                        Visual
                      </div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    <span className="text-info font-bold">Blue</span> = plenty
                    of time.{" "}
                    <span className="text-warning font-bold">Yellow</span> =
                    running low.{" "}
                    <span className="text-error font-bold">Red</span> = almost
                    over!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== CTA ===== */}
          <div className="text-center bg-gradient-to-r from-primary to-secondary text-primary-content rounded-2xl p-10">
            <h3 className="text-3xl font-bold mb-4">Ready to Manage?</h3>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Go to your admin dashboard to verify payments, process
              withdrawals, resolve disputes, and monitor platform activity.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="btn btn-lg bg-white text-primary hover:bg-white/90 border-none gap-2"
              >
                <LayoutDashboard size={20} /> Go to Dashboard
              </Link>
              <Link
                to="/dashboard"
                state={{ adminView: "analytics" }}
                className="btn btn-lg btn-outline border-2 border-white text-white hover:bg-white hover:text-primary gap-2"
              >
                <TrendingUp size={20} /> View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- CONTRACTOR HOMEPAGE VIEW ---
  if (user?.role === "contractor") {
    // Dynamic section counter (normal skips milestone section)
    let sectionNum = 0;
    const nextSection = () => ++sectionNum;

    return (
      <div ref={scrollRevealRef} className="min-h-screen bg-base-100 font-sans">
        {/* Professional Hero */}
        <div className="bg-neutral text-neutral-content py-20 px-6 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80')",
            }}
          ></div>
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-6">
                <div className="badge badge-primary badge-lg font-bold anim-scale-fade">
                  Pro Workspace
                </div>
                <h1 className="text-5xl font-bold leading-tight anim-blur-fade anim-delay-200">
                  Welcome back, <br />
                  <span className="text-primary">{user.fullName}</span>
                </h1>
                <p className="text-lg opacity-80 max-w-xl anim-fade-up anim-delay-400">
                  Track your active jobs, manage earnings, messages and
                  disputes.
                </p>
                <div className="flex gap-4 anim-fade-up anim-delay-500">
                  <Link
                    to="/dashboard"
                    className="btn btn-primary btn-lg shadow-lg gap-2"
                  >
                    <LayoutDashboard size={20} /> My Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="btn btn-outline btn-lg text-white gap-2"
                  >
                    <Settings size={20} /> Settings
                  </Link>
                </div>
              </div>
              {/* Decorative Icon */}
              <div className="hidden md:block opacity-10 anim-slide-right anim-delay-300">
                <Briefcase size={250} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats / Features Section */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-10 text-center anim-on-scroll">
            Your Business at a Glance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-colors anim-on-scroll"
              style={{ transitionDelay: "100ms" }}
            >
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Briefcase size={24} />
                </div>
                <h3 className="card-title">Manage Jobs</h3>
                <p className="opacity-70">
                  View new requests and track active projects in real-time.
                </p>
                <div className="card-actions justify-end mt-4">
                  <Link
                    to="/dashboard"
                    className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View Jobs <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-colors anim-on-scroll"
              style={{ transitionDelay: "200ms" }}
            >
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4">
                  <TrendingUp size={24} />
                </div>
                <h3 className="card-title">Check Earnings</h3>
                <p className="opacity-70">
                  See your financial summary and withdrawal history.
                </p>
                <div className="card-actions justify-end mt-4">
                  <Link
                    to="/dashboard"
                    className="text-secondary font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View Wallet <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-colors anim-on-scroll"
              style={{ transitionDelay: "300ms" }}
            >
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-error/10 flex items-center justify-center text-error mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="card-title">Disputes</h3>
                <p className="opacity-70">
                  View and respond to customer complaints. Submit your defense
                  with proof.
                </p>
                <div className="card-actions justify-end mt-4">
                  <Link
                    to="/dashboard/disputes"
                    className="text-error font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View Disputes <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================= */}
        {/* CONTRACTOR COMPLETE GUIDE - HOW EVERYTHING WORKS */}
        {/* ============================================= */}
        <div className="py-20 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge badge-primary badge-lg mb-4">
              Step-by-Step Guide
            </div>
            <h2 className="text-4xl font-bold mb-4">
              How BuildLink Works for You
            </h2>
            <p className="opacity-60 max-w-2xl mx-auto text-lg">
              Everything explained simply — from getting a new job to
              withdrawing your earnings. Follow these steps and you'll never be
              confused!
            </p>
          </div>

          {/* ===== SECTION 1: NEW JOB REQUEST ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xl">
                {nextSection()}
              </div>
              <h3 className="text-2xl font-bold">
                When You Get a New Job Request
              </h3>
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-3xl">
              When a customer selects you for a job, you'll get a notification.
              Here's what you need to do:
            </p>

            <div className="relative">
              {/* Connection Line */}
              <div className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full z-0"></div>

              <div
                className={`grid grid-cols-1 ${isHeavyDuty ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6`}
              >
                {/* Accept */}
                <div className="card bg-base-100 shadow-lg border-2 border-success/30 hover:border-success/60 hover:-translate-y-2 transition-all duration-300 relative z-10">
                  <div className="card-body items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mb-3">
                      <CheckCircle size={32} className="text-success" />
                    </div>
                    <div className="badge badge-success mb-2">Option 1</div>
                    <h4 className="font-bold text-lg">Accept Job ✅</h4>
                    <p className="text-sm opacity-60">
                      Happy with the job details? Click{" "}
                      <strong>"Accept"</strong>. Customer will then upload
                      payment within 2 hours.
                    </p>
                  </div>
                </div>

                {/* Negotiate - Only for Heavy Duty contractors */}
                {isHeavyDuty && (
                  <div className="card bg-base-100 shadow-lg border-2 border-info/30 hover:border-info/60 hover:-translate-y-2 transition-all duration-300 relative z-10">
                    <div className="card-body items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-info/15 flex items-center justify-center mb-3">
                        <MessageCircle size={32} className="text-info" />
                      </div>
                      <div className="badge badge-info mb-2">Option 2</div>
                      <h4 className="font-bold text-lg">Negotiate 💬</h4>
                      <p className="text-sm opacity-60">
                        Want to discuss price, timeline or scope? Click{" "}
                        <strong>"Negotiate"</strong> to chat with the customer
                        before accepting.
                      </p>
                    </div>
                  </div>
                )}

                {/* Reject */}
                <div className="card bg-base-100 shadow-lg border-2 border-error/30 hover:border-error/60 hover:-translate-y-2 transition-all duration-300 relative z-10">
                  <div className="card-body items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-error/15 flex items-center justify-center mb-3">
                      <XCircle size={32} className="text-error" />
                    </div>
                    <div className={`badge badge-error mb-2`}>
                      {isHeavyDuty ? "Option 3" : "Option 2"}
                    </div>
                    <h4 className="font-bold text-lg">Reject ❌</h4>
                    <p className="text-sm opacity-60">
                      Can't take this job? Click <strong>"Reject"</strong>.
                      You'll be free for other bookings immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timer Warning */}
            <div className="alert alert-warning mt-6 max-w-2xl mx-auto shadow-md">
              <Timer size={20} />
              <div>
                <h4 className="font-bold">⏰ You Have Limited Time!</h4>
                <p className="text-sm">
                  Normal jobs: <strong>1 hour</strong> to respond. Emergency
                  jobs: <strong>30 minutes</strong>. If you don't respond, the
                  booking will be <strong>auto-cancelled</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* ===== SECTION 2: JOB STATUS MEANINGS ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-secondary text-secondary-content flex items-center justify-center font-bold text-xl">
                {nextSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Understanding Job Card Colors & Status
              </h3>
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-3xl">
              Each job card on your dashboard shows a colored badge. Here's what
              every status means:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status 1 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-base-200 hover:bg-base-300 transition-colors">
                <div className="w-4 h-4 rounded-full bg-base-300 border-2 border-gray-400 mt-1 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-sm">🆕 New Request</h4>
                  <p className="text-xs opacity-60">
                    Customer sent you a booking. Accept, Negotiate, or Reject
                    it.
                  </p>
                </div>
              </div>

              {/* Status 2 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-warning/10 hover:bg-warning/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-warning mt-1 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-sm">💳 Waiting for Payment</h4>
                  <p className="text-xs opacity-60">
                    You accepted. Customer has <strong>2 hours</strong> to
                    upload payment proof. Just wait.
                  </p>
                </div>
              </div>

              {/* Status 3 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-info/10 hover:bg-info/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-info mt-1 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-sm">🔍 Admin Verifying</h4>
                  <p className="text-xs opacity-60">
                    Customer paid. Admin is checking the payment proof. Wait for
                    approval.
                  </p>
                </div>
              </div>

              {/* Status 4 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-success/10 hover:bg-success/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-success mt-1 flex-shrink-0 ring-2 ring-success/50 ring-offset-1"></div>
                <div>
                  <h4 className="font-bold text-sm">
                    ✅ Active — Do the Work!
                  </h4>
                  <p className="text-xs opacity-60">
                    Payment verified! <strong>Go do the job</strong>. When done,
                    upload 2 proof photos.
                  </p>
                </div>
              </div>

              {/* Status 5 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-primary mt-1 flex-shrink-0"></div>
                <div>
                  <h4 className="font-bold text-sm">
                    ⏳ Waiting for Satisfaction
                  </h4>
                  <p className="text-xs opacity-60">
                    You submitted proof. Customer has <strong>3 hours</strong>{" "}
                    to approve. Auto-approved if they don't act.
                    {isHeavyDuty && (
                      <span className="font-semibold">
                        {" "}
                        Then next milestone starts!
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Status 6 */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-error/10 hover:bg-error/20 transition-colors">
                <div className="w-4 h-4 rounded-full bg-error mt-1 flex-shrink-0 animate-pulse"></div>
                <div>
                  <h4 className="font-bold text-sm">⚠️ Disputed</h4>
                  <p className="text-xs opacity-60">
                    Customer filed a complaint.{" "}
                    <strong>Submit your defense</strong> with proof photos
                    immediately!
                  </p>
                </div>
              </div>

              {/* Status 7 - Heavy Duty Only: Milestone Payment Cycle */}
              {isHeavyDuty && (
                <div className="flex items-start gap-4 p-4 rounded-xl bg-warning/10 hover:bg-warning/20 transition-colors">
                  <div className="w-4 h-4 rounded-full bg-warning mt-1 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-bold text-sm">
                      🔄 Next Milestone Payment
                    </h4>
                    <p className="text-xs opacity-60">
                      After milestone approved, status goes back to{" "}
                      <strong>"Waiting for Payment"</strong> for the next phase.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== SECTION 3: HOW TO COMPLETE A JOB ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-success text-success-content flex items-center justify-center font-bold text-xl">
                {nextSection()}
              </div>
              <h3 className="text-2xl font-bold">
                {isHeavyDuty
                  ? "How to Complete Each Milestone & Get Paid"
                  : "How to Complete a Job & Get Paid"}
              </h3>
            </div>

            <div className="card bg-gradient-to-br from-success/5 to-base-100 shadow-xl border-2 border-success/20">
              <div className="card-body">
                {/* Step Flow */}
                <div className="flex flex-col gap-0">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-success flex items-center justify-center text-success-content font-bold">
                        1
                      </div>
                      <div className="w-0.5 h-14 bg-success/30"></div>
                    </div>
                    <div className="pt-2 pb-8">
                      <h5 className="font-bold">Do the Work</h5>
                      <p className="text-sm opacity-60">
                        Go to the customer's location and complete the job as
                        described in the booking.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold">
                        2
                      </div>
                      <div className="w-0.5 h-14 bg-primary/30"></div>
                    </div>
                    <div className="pt-2 pb-8">
                      <h5 className="font-bold">Click "Mark Job Done"</h5>
                      <p className="text-sm opacity-60">
                        On your dashboard, find the active job card and click
                        the <strong>"Mark Job Done"</strong> button.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-warning flex items-center justify-center text-warning-content font-bold">
                        3
                      </div>
                      <div className="w-0.5 h-14 bg-warning/30"></div>
                    </div>
                    <div className="pt-2 pb-8">
                      <h5 className="font-bold flex items-center gap-2">
                        Upload 2 Photos{" "}
                        <Camera size={18} className="text-warning" />
                      </h5>
                      <p className="text-sm opacity-60">
                        Take <strong>2 clear photos</strong> of the completed
                        work as proof. This is required — you cannot skip it.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-info flex items-center justify-center text-info-content font-bold">
                        4
                      </div>
                      <div className="w-0.5 h-14 bg-info/30"></div>
                    </div>
                    <div className="pt-2 pb-8">
                      <h5 className="font-bold">
                        {isHeavyDuty
                          ? "Customer Reviews Milestone (3 Hours)"
                          : "Customer Reviews (3 Hours)"}
                      </h5>
                      <p className="text-sm opacity-60">
                        Customer has <strong>3 hours</strong> to approve your
                        work. If they don't respond, payment is{" "}
                        <strong>auto-released</strong> to you!
                      </p>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-accent-content font-bold">
                        5
                      </div>
                    </div>
                    <div className="pt-2">
                      <h5 className="font-bold flex items-center gap-2">
                        Money in Your Wallet! 💰
                      </h5>
                      <p className="text-sm opacity-60">
                        {isHeavyDuty
                          ? "Milestone payment released to your wallet. Next milestone begins automatically — repeat this cycle!"
                          : "Payment released to your BuildLink wallet. You can withdraw anytime (minimum Rs. 500)."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 4: ADMIN COMMISSION ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-info text-info-content flex items-center justify-center font-bold text-xl">
                {nextSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Admin Commission — What You Actually Earn
              </h3>
            </div>

            <div className="card bg-gradient-to-r from-info/10 to-success/10 shadow-xl border-2 border-info/20 max-w-3xl mx-auto">
              <div className="card-body">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Visual Pie */}
                  <div className="flex-shrink-0 text-center">
                    <div className="relative w-40 h-40">
                      <svg
                        className="w-40 h-40 transform -rotate-90"
                        viewBox="0 0 120 120"
                      >
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="currentColor"
                          className="text-base-300"
                          strokeWidth="20"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="currentColor"
                          className="text-success"
                          strokeWidth="20"
                          strokeDasharray="298.45"
                          strokeDashoffset="14.92"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-success">
                          95%
                        </span>
                        <span className="text-xs opacity-50">You Keep</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                      <Wallet size={20} className="text-success" />
                      <div>
                        <h5 className="font-bold text-sm">You Receive: 95%</h5>
                        <p className="text-xs opacity-60">
                          For a Rs. 10,000 job, you get{" "}
                          <strong>Rs. 9,500</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10">
                      <Percent size={20} className="text-warning" />
                      <div>
                        <h5 className="font-bold text-sm">BuildLink Fee: 5%</h5>
                        <p className="text-xs opacity-60">
                          Platform fee for payment safety, customer matching &
                          support
                        </p>
                      </div>
                    </div>
                    <div className="text-xs opacity-50 mt-2 italic">
                      This is only deducted from regular bookings when customer
                      confirms satisfaction or auto-release happens.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 5: DISPUTE DEFENSE ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-error text-error-content flex items-center justify-center font-bold text-xl">
                {nextSection()}
              </div>
              <h3 className="text-2xl font-bold">
                If a Customer Files a Dispute
              </h3>
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-3xl">
              Don't panic! If a customer is unhappy, here's what happens and
              what you need to do:
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="card bg-base-100 shadow-lg border-2 border-error/20 hover:border-error/50 transition-all duration-300 hover:-translate-y-1">
                <div className="card-body">
                  <div className="w-14 h-14 rounded-lg bg-error/10 flex items-center justify-center mb-3 text-error">
                    <AlertTriangle size={28} />
                  </div>
                  <div className="badge badge-error badge-sm mb-2">Step 1</div>
                  <h4 className="font-bold text-lg">You Get Notified</h4>
                  <p className="text-sm opacity-70">
                    When customer reports an issue, your{" "}
                    <strong>payment is frozen</strong> and you get an alert. Go
                    to your <strong>Disputes page</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="card bg-base-100 shadow-lg border-2 border-warning/20 hover:border-warning/50 transition-all duration-300 hover:-translate-y-1">
                <div className="card-body">
                  <div className="w-14 h-14 rounded-lg bg-warning/10 flex items-center justify-center mb-3 text-warning">
                    <FileText size={28} />
                  </div>
                  <div className="badge badge-warning badge-sm mb-2">
                    Step 2
                  </div>
                  <h4 className="font-bold text-lg">Submit Your Defense</h4>
                  <p className="text-sm opacity-70">
                    Write your side of the story and{" "}
                    <strong>upload proof photos</strong> showing your work was
                    done properly.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="card bg-base-100 shadow-lg border-2 border-info/20 hover:border-info/50 transition-all duration-300 hover:-translate-y-1">
                <div className="card-body">
                  <div className="w-14 h-14 rounded-lg bg-info/10 flex items-center justify-center mb-3 text-info">
                    <Shield size={28} />
                  </div>
                  <div className="badge badge-info badge-sm mb-2">Step 3</div>
                  <h4 className="font-bold text-lg">Admin Decides Fairly</h4>
                  <p className="text-sm opacity-70">
                    Admin reviews both sides with AI analysis. Fair decisions:
                    you get paid, customer gets refund, or it's split.
                  </p>
                </div>
              </div>
            </div>

            {/* Dispute Outcomes */}
            <div className="mt-8 card bg-base-200 shadow-md max-w-3xl mx-auto">
              <div className="card-body">
                <h4 className="font-bold text-center mb-4">
                  Possible Outcomes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-success/10 border border-success/20">
                    <div className="text-2xl mb-1">✅</div>
                    <h5 className="font-bold text-sm text-success">
                      Released to You
                    </h5>
                    <p className="text-xs opacity-60">
                      Customer complaint invalid. You get <strong>95%</strong>{" "}
                      of payment.
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-error/10 border border-error/20">
                    <div className="text-2xl mb-1">💸</div>
                    <h5 className="font-bold text-sm text-error">
                      Refunded to Customer
                    </h5>
                    <p className="text-xs opacity-60">
                      If work was not done properly. Customer gets{" "}
                      <strong>100% refund</strong>.
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-warning/10 border border-warning/20">
                    <div className="text-2xl mb-1">⚖️</div>
                    <h5 className="font-bold text-sm text-warning">
                      Split Payment
                    </h5>
                    <p className="text-xs opacity-60">
                      Partial work done. Payment split fairly — you get{" "}
                      <strong>47.5%</strong>, customer gets{" "}
                      <strong>47.5%</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 6: HEAVY DUTY MILESTONES FOR CONTRACTORS (Heavy Duty Only) ===== */}
          {isHeavyDuty && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-warning text-warning-content flex items-center justify-center font-bold text-xl">
                  {nextSection()}
                </div>
                <h3 className="text-2xl font-bold">
                  Heavy Duty Jobs — Milestone System
                </h3>
              </div>
              <p className="text-sm opacity-60 mb-6 max-w-3xl">
                Big construction projects are split into{" "}
                <strong>phases (milestones)</strong> — every 2 days. You get
                paid after each phase, not at the end!
              </p>

              <div className="card bg-gradient-to-br from-warning/5 to-base-100 shadow-xl border-2 border-warning/20">
                <div className="card-body">
                  {/* Milestone Cycle */}
                  <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Layers size={20} className="text-warning" /> Each Milestone
                    Cycle
                  </h4>

                  <div className="flex flex-wrap justify-center gap-3 mb-6">
                    {/* Phase Cards */}
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-warning/10 border border-warning/20 min-w-[100px]">
                      <Banknote size={22} className="text-warning" />
                      <span className="text-xs font-bold">Client Pays</span>
                      <span className="text-[10px] opacity-50">
                        Milestone Amount
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ChevronRight size={20} className="text-warning/50" />
                    </div>

                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-info/10 border border-info/20 min-w-[100px]">
                      <Eye size={22} className="text-info" />
                      <span className="text-xs font-bold">Admin Verifies</span>
                      <span className="text-[10px] opacity-50">
                        Payment Proof
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ChevronRight size={20} className="text-info/50" />
                    </div>

                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-success/10 border border-success/20 min-w-[100px]">
                      <Hammer size={22} className="text-success" />
                      <span className="text-xs font-bold">You Work</span>
                      <span className="text-[10px] opacity-50">
                        2 Days Phase
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ChevronRight size={20} className="text-success/50" />
                    </div>

                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-primary/10 border border-primary/20 min-w-[100px]">
                      <Camera size={22} className="text-primary" />
                      <span className="text-xs font-bold">Upload Proof</span>
                      <span className="text-[10px] opacity-50">2 Photos</span>
                    </div>
                    <div className="flex items-center">
                      <ChevronRight size={20} className="text-primary/50" />
                    </div>

                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-accent/10 border border-accent/20 min-w-[100px]">
                      <Wallet size={22} className="text-accent" />
                      <span className="text-xs font-bold">Get Paid!</span>
                      <span className="text-[10px] opacity-50">
                        To Your Wallet
                      </span>
                    </div>
                  </div>

                  <div className="alert alert-info">
                    <Layers size={18} />
                    <span className="text-sm">
                      This cycle <strong>repeats</strong> for each milestone
                      until the entire project is complete. You earn after every
                      phase!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== SECTION 7: WITHDRAWAL ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-accent text-accent-content flex items-center justify-center font-bold text-xl">
                {nextSection()}
              </div>
              <h3 className="text-2xl font-bold">Withdrawing Your Earnings</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* How to Withdraw */}
              <div className="card bg-gradient-to-br from-accent/10 to-accent/5 shadow-lg border-2 border-accent/20">
                <div className="card-body">
                  <h4 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <Wallet size={20} className="text-accent" /> How to Withdraw
                  </h4>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        1
                      </div>
                      <p className="text-sm opacity-70 pt-1">
                        Go to your <strong>Dashboard → Wallet</strong> section
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        2
                      </div>
                      <p className="text-sm opacity-70 pt-1">
                        Click <strong>"Withdraw Funds"</strong> button
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        3
                      </div>
                      <p className="text-sm opacity-70 pt-1">
                        Enter amount (minimum <strong>Rs. 500</strong>)
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        4
                      </div>
                      <p className="text-sm opacity-70 pt-1">
                        Admin processes your withdrawal and sends proof
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Status Guide */}
              <div className="card bg-base-100 shadow-lg border border-base-300">
                <div className="card-body">
                  <h4 className="font-bold text-lg mb-4">
                    Withdrawal Status Meaning
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10">
                      <div className="badge badge-warning badge-sm">
                        Pending
                      </div>
                      <p className="text-xs opacity-70">
                        Your request is being processed by admin
                      </p>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
                      <div className="badge badge-success badge-sm">
                        Completed
                      </div>
                      <p className="text-xs opacity-70">
                        Money sent to your account! Check transaction proof.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-error/10">
                      <div className="badge badge-error badge-sm">Rejected</div>
                      <p className="text-xs opacity-70">
                        Issue with request. Contact support for help.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 8: ALL TIMERS ===== */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-neutral text-neutral-content flex items-center justify-center font-bold text-xl">
                {nextSection()}
              </div>
              <h3 className="text-2xl font-bold">
                Important Timers & Deadlines
              </h3>
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-3xl">
              BuildLink uses countdown timers to keep everything moving. Watch
              these on your dashboard — they change color when time is running
              out!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Timer Cards */}
              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Timer size={20} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Accept/Reject</h4>
                      <div className="badge badge-primary badge-xs">1 Hour</div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    Respond to new job requests. Auto-cancelled if you don't
                    respond in time.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Hourglass size={20} className="text-warning" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Client Payment</h4>
                      <div className="badge badge-warning badge-xs">
                        2 Hours
                      </div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    After you accept, client has 2 hours to pay. If they don't,
                    booking is cancelled and you're free.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <ThumbsUp size={20} className="text-success" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Auto-Release</h4>
                      <div className="badge badge-success badge-xs">
                        3 Hours
                      </div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    After you submit proof photos, client has 3 hours. If they
                    do nothing, you get paid automatically!
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                      <AlertTriangle size={20} className="text-error" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Job Deadline</h4>
                      <div className="badge badge-error badge-xs">
                        Must Finish
                      </div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    Finish the job before the deadline! If you miss it, job is
                    marked incomplete and client is refunded.
                  </p>
                </div>
              </div>

              {isHeavyDuty && (
                <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                  <div className="card-body p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                        <Layers size={20} className="text-info" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">
                          Milestone Deadline
                        </h4>
                        <div className="badge badge-info badge-xs">
                          Per Phase
                        </div>
                      </div>
                    </div>
                    <p className="text-xs opacity-60">
                      Each milestone has its own deadline. Upload proof photos
                      before it expires!
                    </p>
                  </div>
                </div>
              )}

              <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Eye size={20} className="text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Timer Colors</h4>
                      <div className="badge badge-secondary badge-xs">
                        Visual
                      </div>
                    </div>
                  </div>
                  <p className="text-xs opacity-60">
                    <span className="text-info font-bold">Blue</span> = plenty
                    of time.{" "}
                    <span className="text-warning font-bold">Yellow</span> =
                    hurry up! <span className="text-error font-bold">Red</span>{" "}
                    = almost over!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== CTA ===== */}
          <div className="text-center bg-gradient-to-r from-primary to-secondary text-primary-content rounded-2xl p-10">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Working?</h3>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Go to your dashboard to view pending requests, manage active jobs,
              and track your earnings.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="btn btn-lg bg-white text-primary hover:bg-white/90 border-none gap-2"
              >
                <LayoutDashboard size={20} /> Go to Dashboard
              </Link>
              <Link
                to="/profile"
                className="btn btn-lg btn-outline border-2 border-white text-white hover:bg-white hover:text-primary gap-2"
              >
                <Settings size={20} /> Update Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD HOMEOWNER VIEW (Keep your existing code) ---
  return (
    <div ref={scrollRevealRef} className="min-h-screen bg-base-100 font-sans">
      {/* --- HERO SECTION --- */}
      <div
        className="hero min-h-[600px] relative"
        style={{
          backgroundImage:
            "url(https://media.smallbiztrends.com/2022/12/construction-tools.png)",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/35 to-transparent"></div>

        <div className="hero-content text-center text-neutral-content relative z-10 pt-20 md:pt-0">
          <div className="max-w-2xl">
            <div className="inline-flex items-center mb-6 px-5 py-2.5 rounded-full border border-white/45 bg-black/45 backdrop-blur-sm text-primary text-base md:text-lg font-extrabold tracking-wide shadow-lg shadow-black/35 anim-scale-fade">
              #1 Construction Marketplace in Pakistan
            </div>
            <h1 className="mb-6 text-5xl md:text-6xl font-extrabold leading-tight anim-blur-fade anim-delay-200">
              Build Your Dream <br />
              <span className="text-primary">With Confidence</span>
            </h1>
            <p className="mb-8 text-lg opacity-90 anim-fade-up anim-delay-400">
              Hire verified plumbers, electricians, and builders with 100%
              payment safety. We hold the money until you are satisfied.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center anim-fade-up anim-delay-500">
              <Link
                to="/contractors"
                className="btn btn-primary btn-lg shadow-lg hover:shadow-primary/50 border-none"
              >
                Find a Pro
              </Link>
              <Link
                to="/ai-estimator"
                className="btn btn-accent btn-lg shadow-lg hover:shadow-accent/50 border-none text-white"
              >
                Get Estimations
              </Link>
              <Link
                to="/dashboard"
                className="btn btn-secondary btn-lg shadow-lg hover:shadow-secondary/50 border-none"
              >
                <LayoutDashboard size={20} /> My Dashboard
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-sm font-medium opacity-80 anim-fade-up anim-delay-700">
              <span className="flex items-center gap-1">
                <ShieldCheck size={18} className="text-success" /> Verified Pros
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle size={18} className="text-success" /> Secure Pay
              </span>
              <span className="flex items-center gap-1">
                <Star size={18} className="text-warning" /> 4.8/5 Ratings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- STATS SECTION --- */}
      <div className="bg-base-200 py-10 border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="anim-on-scroll" style={{ transitionDelay: "0ms" }}>
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-sm opacity-60">Verified Contractors</div>
          </div>
          <div className="anim-on-scroll" style={{ transitionDelay: "100ms" }}>
            <div className="text-3xl font-bold text-secondary">1.2k</div>
            <div className="text-sm opacity-60">Projects Completed</div>
          </div>
          <div className="anim-on-scroll" style={{ transitionDelay: "200ms" }}>
            <div className="text-3xl font-bold text-accent">98%</div>
            <div className="text-sm opacity-60">Satisfaction Rate</div>
          </div>
          <div className="anim-on-scroll" style={{ transitionDelay: "300ms" }}>
            <div className="text-3xl font-bold text-info">24/7</div>
            <div className="text-sm opacity-60">Support Available</div>
          </div>
        </div>
      </div>

      {/* --- EXPLORE SERVICES --- */}
      <div className="py-16 px-4 max-w-7xl mx-auto bg-base-200/50 rounded-3xl my-10">
        <h2 className="text-3xl font-bold text-center mb-10 anim-on-scroll">
          Explore Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Construction Card */}
          <div
            className="card bg-base-100 shadow-xl hover:-translate-y-2 transition-transform duration-300 overflow-hidden group cursor-pointer anim-on-scroll"
            style={{ transitionDelay: "100ms" }}
            onClick={() => setShowConstructionModal(true)}
          >
            <figure className="h-48 relative">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
              <img
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=500"
                alt="Construction"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Construction</h2>
              <p className="text-sm opacity-70">
                Ground-up construction for homes, plazas, and boundaries.
              </p>
              <div className="card-actions justify-end mt-4">
                <Link
                  to="#"
                  className="btn btn-sm btn-primary gap-2"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setShowConstructionModal(true);
                  }}
                >
                  Explore <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Renovation Card */}
          <div
            className="card bg-base-100 shadow-xl hover:-translate-y-2 transition-transform duration-300 overflow-hidden group anim-on-scroll"
            style={{ transitionDelay: "200ms" }}
          >
            <figure className="h-48 relative">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
              <img
                src="https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&q=80&w=500"
                alt="Renovation"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Renovation</h2>
              <p className="text-sm opacity-70">
                Bathroom upgrades, kitchen remodeling, and flooring.
              </p>
              <div className="card-actions justify-end mt-4">
                <Link
                  to="/services/renovation"
                  className="btn btn-sm btn-primary gap-2"
                >
                  Explore <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Modification Card */}
          <div
            className="card bg-base-100 shadow-xl hover:-translate-y-2 transition-transform duration-300 overflow-hidden group anim-on-scroll"
            style={{ transitionDelay: "300ms" }}
          >
            <figure className="h-48 relative">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
              <img
                src="https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&q=80&w=500"
                alt="Modification"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Modification</h2>
              <p className="text-sm opacity-70">
                Structural changes, room extensions, and layout alterations.
              </p>
              <div className="card-actions justify-end mt-4">
                <Link
                  to="/services/modification"
                  className="btn btn-sm btn-primary gap-2"
                >
                  Explore <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Construction Modal */}
      {showConstructionModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto overscroll-contain"
          onClick={() => setShowConstructionModal(false)}
        >
          <div
            className="bg-base-100 rounded-2xl max-w-4xl w-full p-8 relative animate-fade-in my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowConstructionModal(false)}
              className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
            >
              <X size={20} />
            </button>

            <h2 className="text-3xl font-bold mb-6 text-center">
              Choose Construction Type
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* General Construction Card */}
              <div className="card w-[72%] md:w-4/5 mx-auto bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group">
                <figure className="h-28 md:h-56 relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                  <img
                    src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=500"
                    alt="General Construction"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </figure>
                <div className="card-body p-3 md:p-6">
                  <h3 className="card-title text-base md:text-xl">
                    General Construction
                  </h3>
                  <p className="text-xs md:text-sm opacity-70">
                    Find verified plumbers, carpenters, electricians, and other
                    skilled professionals for your project.
                  </p>
                  <div className="card-actions justify-end mt-2 md:mt-4">
                    <Link
                      to="/services/construction"
                      className="btn btn-sm md:btn-md btn-primary gap-2"
                      onClick={() => setShowConstructionModal(false)}
                    >
                      Explore <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Heavy Duty Construction Card */}
              <div className="card w-[72%] md:w-4/5 mx-auto bg-base-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group">
                <figure className="h-28 md:h-56 relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                  <img
                    src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=500"
                    alt="Heavy Duty Construction"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </figure>
                <div className="card-body p-3 md:p-6">
                  <h3 className="card-title text-base md:text-xl">
                    Heavy Duty Construction
                  </h3>
                  <p className="text-xs md:text-sm opacity-70">
                    Large-scale construction projects including plazas,
                    commercial buildings, and major structural work.
                  </p>
                  <div className="card-actions justify-end mt-2 md:mt-4">
                    <Link
                      to="/services/heavy-duty-construction"
                      className="btn btn-sm md:btn-md btn-primary gap-2"
                      onClick={() => setShowConstructionModal(false)}
                    >
                      Explore <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HOW IT WORKS - COMPREHENSIVE GUIDE --- */}
      <div className="py-20 px-4 max-w-7xl mx-auto bg-gradient-to-br from-base-200/50 to-base-100 rounded-3xl">
        <div className="text-center mb-16 anim-on-scroll">
          <div className="badge badge-primary badge-lg mb-4">
            Complete Guide
          </div>
          <h2 className="text-4xl font-bold mb-4">How BuildLink Works</h2>
          <p className="opacity-60 max-w-2xl mx-auto text-lg">
            Everything you need to know about using BuildLink - from booking to
            completion, disputes to payments, and AI-powered features.
          </p>
        </div>

        {/* Section 1: Booking & Tracking */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8 anim-on-scroll">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xl">
              1
            </div>
            <h3 className="text-2xl font-bold">
              Booking & Tracking Your Project
            </h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              className="card bg-base-100 shadow-lg border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 anim-on-scroll"
              style={{ transitionDelay: "50ms" }}
            >
              <div className="card-body">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <Search size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Find Contractor</h4>
                <p className="text-sm opacity-70">
                  Browse verified contractors by service, location, ratings, and
                  availability. Filter by skills and experience.
                </p>
              </div>
            </div>
            <div
              className="card bg-base-100 shadow-lg border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 anim-on-scroll"
              style={{ transitionDelay: "100ms" }}
            >
              <div className="card-body">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <Calendar size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Book Service</h4>
                <p className="text-sm opacity-70">
                  Select date, time, describe your project, and submit booking
                  request. Contractor has 3 hours to accept.
                </p>
              </div>
            </div>
            <div
              className="card bg-base-100 shadow-lg border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 anim-on-scroll"
              style={{ transitionDelay: "150ms" }}
            >
              <div className="card-body">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <CreditCard size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Secure Payment</h4>
                <p className="text-sm opacity-70">
                  Upload payment proof once approved. Admin verifies within 24
                  hours. Funds held securely until job completion.
                </p>
              </div>
            </div>
            <div
              className="card bg-base-100 shadow-lg border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 anim-on-scroll"
              style={{ transitionDelay: "200ms" }}
            >
              <div className="card-body">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <Eye size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Track Progress</h4>
                <p className="text-sm opacity-70">
                  Monitor job status in real-time via your dashboard. Get
                  notifications at every stage from pending to completion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Disputes & Resolution */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8 anim-on-scroll">
            <div className="w-12 h-12 rounded-full bg-error text-error-content flex items-center justify-center font-bold text-xl">
              2
            </div>
            <h3 className="text-2xl font-bold">Dispute Management System</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div
              className="card bg-base-100 shadow-lg border-2 border-error/20 hover:border-error/50 transition-all duration-300 hover:-translate-y-1 anim-on-scroll"
              style={{ transitionDelay: "50ms" }}
            >
              <div className="card-body">
                <div className="w-14 h-14 rounded-lg bg-error/10 flex items-center justify-center mb-3 text-error">
                  <AlertTriangle size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Report Issue</h4>
                <p className="text-sm opacity-70">
                  After job completion, if unsatisfied, click "Report Issue".
                  Describe the problem with details and upload proof images.
                </p>
              </div>
            </div>
            <div
              className="card bg-base-100 shadow-lg border-2 border-error/20 hover:border-error/50 transition-all duration-300 hover:-translate-y-1 anim-on-scroll"
              style={{ transitionDelay: "100ms" }}
            >
              <div className="card-body">
                <div className="w-14 h-14 rounded-lg bg-error/10 flex items-center justify-center mb-3 text-error">
                  <FileText size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Contractor Defense</h4>
                <p className="text-sm opacity-70">
                  Contractor receives notification and has 48 hours to submit
                  their defense with supporting evidence.
                </p>
              </div>
            </div>
            <div
              className="card bg-base-100 shadow-lg border-2 border-error/20 hover:border-error/50 transition-all duration-300 hover:-translate-y-1 anim-on-scroll"
              style={{ transitionDelay: "150ms" }}
            >
              <div className="card-body">
                <div className="w-14 h-14 rounded-lg bg-error/10 flex items-center justify-center mb-3 text-error">
                  <Shield size={28} />
                </div>
                <h4 className="font-bold text-lg mb-2">Admin Decision</h4>
                <p className="text-sm opacity-70">
                  Admin reviews both sides and makes fair decision: Full Refund,
                  Full Release, or Split payment. Track status in Disputes page.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Payment System */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8 anim-on-scroll">
            <div className="w-12 h-12 rounded-full bg-success text-success-content flex items-center justify-center font-bold text-xl">
              3
            </div>
            <h3 className="text-2xl font-bold">Payment System Explained</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div
              className="card bg-gradient-to-br from-success/10 to-success/5 shadow-xl border-2 border-success/30 anim-on-scroll"
              style={{ transitionDelay: "50ms" }}
            >
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center text-success">
                    <DollarSign size={24} />
                  </div>
                  <h4 className="font-bold text-xl">Normal Booking Payment</h4>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle
                      size={16}
                      className="text-success mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Payment Deadline:</strong> 3 hours after
                      contractor accepts
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle
                      size={16}
                      className="text-success mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Verification:</strong> Admin reviews payment proof
                      within 24 hours
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle
                      size={16}
                      className="text-success mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Fund Holding:</strong> Money held securely by
                      BuildLink escrow
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle
                      size={16}
                      className="text-success mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Release:</strong> After you confirm job
                      satisfaction or auto-release after 3 hours of completion
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle
                      size={16}
                      className="text-success mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Safety:</strong> 100% money-back guarantee if
                      contractor doesn't show up
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            <div
              className="card bg-gradient-to-br from-warning/10 to-warning/5 shadow-xl border-2 border-warning/30 anim-on-scroll"
              style={{ transitionDelay: "100ms" }}
            >
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center text-warning">
                    <AlertTriangle size={24} />
                  </div>
                  <h4 className="font-bold text-xl">Dispute Payment Flow</h4>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-warning mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Funds Frozen:</strong> Payment locked when dispute
                      is filed
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-warning mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Admin Review:</strong> Detailed examination of
                      evidence from both parties
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-warning mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Full Refund:</strong> If contractor at fault, 95%
                      refund (5% admin fee)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-warning mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Full Release:</strong> If user complaint invalid,
                      contractor gets 95% (5% admin fee)
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-warning mt-0.5 flex-shrink-0"
                    />
                    <span>
                      <strong>Split Payment:</strong> Partial work done - fair
                      distribution based on admin assessment
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Heavy Duty Construction Booking */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8 anim-on-scroll">
            <div className="w-12 h-12 rounded-full bg-warning text-warning-content flex items-center justify-center font-bold text-xl">
              4
            </div>
            <h3 className="text-2xl font-bold">
              Heavy Duty Construction Booking
            </h3>
          </div>
          <p className="text-sm opacity-60 mb-6 max-w-3xl">
            For large-scale projects (plazas, commercial buildings, bridges,
            etc.), BuildLink uses a <strong>milestone-based system</strong> that
            splits the project into manageable phases — protecting both you and
            the contractor.
          </p>

          {/* Visual Step Flow */}
          <div className="relative">
            {/* Connection Line (desktop) */}
            <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-1 bg-gradient-to-r from-warning/30 via-warning to-warning/30 rounded-full z-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Step 1 */}
              <div className="card bg-base-100 shadow-lg border-2 border-warning/20 hover:border-warning/60 transition-all duration-300 hover:-translate-y-2 relative z-10">
                <div className="card-body items-center text-center p-5">
                  <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center mb-2">
                    <Building2 size={28} className="text-warning" />
                  </div>
                  <div className="badge badge-warning badge-sm mb-1">
                    Step 1
                  </div>
                  <h4 className="font-bold text-sm">Choose Project</h4>
                  <p className="text-xs opacity-60">
                    Pick from 35+ heavy-duty construction categories or describe
                    a custom project
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="card bg-base-100 shadow-lg border-2 border-warning/20 hover:border-warning/60 transition-all duration-300 hover:-translate-y-2 relative z-10">
                <div className="card-body items-center text-center p-5">
                  <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center mb-2">
                    <Search size={28} className="text-warning" />
                  </div>
                  <div className="badge badge-warning badge-sm mb-1">
                    Step 2
                  </div>
                  <h4 className="font-bold text-sm">Find & Chat</h4>
                  <p className="text-xs opacity-60">
                    Browse contractors, chat in real-time to negotiate scope,
                    timeline & budget
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="card bg-base-100 shadow-lg border-2 border-warning/20 hover:border-warning/60 transition-all duration-300 hover:-translate-y-2 relative z-10">
                <div className="card-body items-center text-center p-5">
                  <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center mb-2">
                    <Calendar size={28} className="text-warning" />
                  </div>
                  <div className="badge badge-warning badge-sm mb-1">
                    Step 3
                  </div>
                  <h4 className="font-bold text-sm">Set Dates & Budget</h4>
                  <p className="text-xs opacity-60">
                    Enter start/end dates, total budget — milestones are
                    auto-generated every 2 days
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="card bg-base-100 shadow-lg border-2 border-warning/20 hover:border-warning/60 transition-all duration-300 hover:-translate-y-2 relative z-10">
                <div className="card-body items-center text-center p-5">
                  <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center mb-2">
                    <Hammer size={28} className="text-warning" />
                  </div>
                  <div className="badge badge-warning badge-sm mb-1">
                    Step 4
                  </div>
                  <h4 className="font-bold text-sm">Submit Booking</h4>
                  <p className="text-xs opacity-60">
                    Contractor gets 1 hour to accept. Once accepted, you pay
                    milestone-by-milestone
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="card bg-base-100 shadow-lg border-2 border-warning/20 hover:border-warning/60 transition-all duration-300 hover:-translate-y-2 relative z-10">
                <div className="card-body items-center text-center p-5">
                  <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mb-2">
                    <ThumbsUp size={28} className="text-success" />
                  </div>
                  <div className="badge badge-success badge-sm mb-1">
                    Step 5
                  </div>
                  <h4 className="font-bold text-sm">Approve & Repeat</h4>
                  <p className="text-xs opacity-60">
                    Review each milestone, approve payment release — then next
                    milestone begins!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Milestone Payment & Satisfaction */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8 anim-on-scroll">
            <div className="w-12 h-12 rounded-full bg-accent text-accent-content flex items-center justify-center font-bold text-xl">
              5
            </div>
            <h3 className="text-2xl font-bold">
              Milestone Payments & User Satisfaction
            </h3>
          </div>

          {/* Milestone Lifecycle Visual */}
          <div className="card bg-gradient-to-br from-accent/5 to-base-100 shadow-xl border-2 border-accent/20 mb-8">
            <div className="card-body">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Layers size={20} className="text-accent" /> How Each Milestone
                Works
              </h4>
              <p className="text-sm opacity-60 mb-6">
                Your total budget is split into milestones (one per 2 days).
                Each milestone goes through this lifecycle independently:
              </p>

              {/* Milestone Flow Steps */}
              <div className="flex flex-col gap-0">
                {/* Row 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold text-sm">
                      1
                    </div>
                    <div className="w-0.5 h-12 bg-primary/30"></div>
                  </div>
                  <div className="pt-1.5 pb-6">
                    <h5 className="font-bold text-sm">Payment Upload</h5>
                    <p className="text-xs opacity-60">
                      Upload payment screenshot for this milestone amount. You
                      have <strong>2 hours</strong> after contractor accepts.
                    </p>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-info flex items-center justify-center text-info-content font-bold text-sm">
                      2
                    </div>
                    <div className="w-0.5 h-12 bg-info/30"></div>
                  </div>
                  <div className="pt-1.5 pb-6">
                    <h5 className="font-bold text-sm">Admin Verification</h5>
                    <p className="text-xs opacity-60">
                      Admin verifies your payment proof. Funds are held securely
                      until work is done.
                    </p>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center text-warning-content font-bold text-sm">
                      3
                    </div>
                    <div className="w-0.5 h-12 bg-warning/30"></div>
                  </div>
                  <div className="pt-1.5 pb-6">
                    <h5 className="font-bold text-sm">Contractor Works</h5>
                    <p className="text-xs opacity-60">
                      Contractor completes this milestone's work, then submits{" "}
                      <strong>2 completion photos</strong> as proof.
                    </p>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-success-content font-bold text-sm">
                      4
                    </div>
                    <div className="w-0.5 h-12 bg-success/30"></div>
                  </div>
                  <div className="pt-1.5 pb-6">
                    <h5 className="font-bold text-sm">
                      Your Review & Approval
                    </h5>
                    <p className="text-xs opacity-60">
                      Review completion photos. Click{" "}
                      <strong>"Approve Milestone"</strong> if satisfied. You
                      have <strong>3 hours</strong> — auto-approved if no
                      action.
                    </p>
                  </div>
                </div>

                {/* Row 5 */}
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-content font-bold text-sm">
                      5
                    </div>
                  </div>
                  <div className="pt-1.5">
                    <h5 className="font-bold text-sm">
                      Payment Released → Next Milestone
                    </h5>
                    <p className="text-xs opacity-60">
                      Milestone payment released to contractor wallet. If more
                      milestones remain, the cycle repeats for the next one!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Satisfaction & Dispute Choice */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card bg-gradient-to-br from-success/10 to-success/5 shadow-lg border-2 border-success/30 hover:-translate-y-1 transition-all duration-300">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center text-success">
                    <ThumbsUp size={24} />
                  </div>
                  <h4 className="font-bold text-lg">Satisfied? Approve!</h4>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle
                      size={14}
                      className="text-success mt-0.5 flex-shrink-0"
                    />
                    <span>Review contractor's completion photos</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle
                      size={14}
                      className="text-success mt-0.5 flex-shrink-0"
                    />
                    <span>
                      Click <strong>"Approve Milestone X"</strong> to release
                      payment
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle
                      size={14}
                      className="text-success mt-0.5 flex-shrink-0"
                    />
                    <span>Leave a rating & review for the contractor</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle
                      size={14}
                      className="text-success mt-0.5 flex-shrink-0"
                    />
                    <span>Next milestone automatically starts</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-error/10 to-error/5 shadow-lg border-2 border-error/30 hover:-translate-y-1 transition-all duration-300">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-error/20 flex items-center justify-center text-error">
                    <AlertTriangle size={24} />
                  </div>
                  <h4 className="font-bold text-lg">Not Satisfied? Dispute!</h4>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <AlertTriangle
                      size={14}
                      className="text-error mt-0.5 flex-shrink-0"
                    />
                    <span>
                      Click <strong>"Report Issue"</strong> within the 3-hour
                      window
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle
                      size={14}
                      className="text-error mt-0.5 flex-shrink-0"
                    />
                    <span>Describe the problem & upload evidence images</span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle
                      size={14}
                      className="text-error mt-0.5 flex-shrink-0"
                    />
                    <span>
                      Payment for that milestone is <strong>frozen</strong>{" "}
                      instantly
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <AlertTriangle
                      size={14}
                      className="text-error mt-0.5 flex-shrink-0"
                    />
                    <span>
                      Admin reviews & resolves fairly (refund / release / split)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Timers & Auto-Safety */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-neutral text-neutral-content flex items-center justify-center font-bold text-xl">
              6
            </div>
            <h3 className="text-2xl font-bold">Timers & Auto-Safety System</h3>
          </div>
          <p className="text-sm opacity-60 mb-6 max-w-3xl">
            BuildLink uses smart countdown timers to keep projects moving and
            protect everyone. If a deadline is missed, the system acts
            automatically.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Timer 1 */}
            <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Timer size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Contractor Acceptance</h4>
                    <div className="badge badge-primary badge-xs">1 Hour</div>
                  </div>
                </div>
                <p className="text-xs opacity-60">
                  Contractor must accept or decline within 1 hour.
                  Auto-cancelled if no response — you can rebook instantly.
                </p>
              </div>
            </div>

            {/* Timer 2 */}
            <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <CreditCard size={20} className="text-info" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Payment Upload</h4>
                    <div className="badge badge-info badge-xs">2 Hours</div>
                  </div>
                </div>
                <p className="text-xs opacity-60">
                  After acceptance, upload payment proof within 2 hours. Booking
                  auto-cancels if missed — contractor is freed.
                </p>
              </div>
            </div>

            {/* Timer 3 */}
            <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <ThumbsUp size={20} className="text-success" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Satisfaction Review</h4>
                    <div className="badge badge-success badge-xs">3 Hours</div>
                  </div>
                </div>
                <p className="text-xs opacity-60">
                  After contractor submits completion, you have 3 hours to
                  approve or dispute. Auto-approved if no action taken.
                </p>
              </div>
            </div>

            {/* Timer 4 */}
            <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Clock size={20} className="text-warning" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Milestone Deadline</h4>
                    <div className="badge badge-warning badge-xs">
                      Per Phase
                    </div>
                  </div>
                </div>
                <p className="text-xs opacity-60">
                  Each milestone has a deadline. If contractor doesn't finish &
                  upload photos, the job is marked incomplete and you're
                  refunded.
                </p>
              </div>
            </div>

            {/* Timer 5 */}
            <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                    <Shield size={20} className="text-error" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Incomplete Job Refund</h4>
                    <div className="badge badge-error badge-xs">Auto</div>
                  </div>
                </div>
                <p className="text-xs opacity-60">
                  If a project passes its final deadline without completion,
                  full refund is automatically processed to your wallet.
                </p>
              </div>
            </div>

            {/* Timer 6 */}
            <div className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Eye size={20} className="text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Live Countdown</h4>
                    <div className="badge badge-secondary badge-xs">Visual</div>
                  </div>
                </div>
                <p className="text-xs opacity-60">
                  All timers are visible on your dashboard as live countdowns
                  with color-coded urgency (blue → yellow → red).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Advisory Visit */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-info text-info-content flex items-center justify-center font-bold text-xl">
              7
            </div>
            <h3 className="text-2xl font-bold">Advisory Visit Service</h3>
          </div>
          <div className="card bg-gradient-to-br from-info/10 to-info/5 shadow-xl border-2 border-info/30 max-w-4xl mx-auto">
            <div className="card-body">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-20 h-20 rounded-2xl bg-info/20 flex items-center justify-center text-info flex-shrink-0">
                  <MessageCircle size={40} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-2xl mb-3">
                    Need Expert Consultation?
                  </h4>
                  <p className="opacity-70 mb-4">
                    Not sure about your project scope, budget, or requirements?
                    Get professional on-site advisory visit from our admin team.
                  </p>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex gap-2 items-start">
                      <CheckCircle
                        size={16}
                        className="text-info mt-1 flex-shrink-0"
                      />
                      <span>
                        <strong>Step 1:</strong> Click "Advisory Visit" in
                        navigation or footer
                      </span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <CheckCircle
                        size={16}
                        className="text-info mt-1 flex-shrink-0"
                      />
                      <span>
                        <strong>Step 2:</strong> Contact admin directly via
                        WhatsApp by clicking the contact button
                      </span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <CheckCircle
                        size={16}
                        className="text-info mt-1 flex-shrink-0"
                      />
                      <span>
                        <strong>Step 3:</strong> Schedule a convenient time for
                        site visit
                      </span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <CheckCircle
                        size={16}
                        className="text-info mt-1 flex-shrink-0"
                      />
                      <span>
                        <strong>Services:</strong> Cost estimation, material
                        advice, contractor recommendations, project timeline
                        planning
                      </span>
                    </div>
                  </div>
                  <a
                    href="https://wa.me/+923014862236"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-info gap-2"
                  >
                    <MessageCircle size={18} /> Contact Admin on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8: AI Features */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-secondary text-secondary-content flex items-center justify-center font-bold text-xl">
              8
            </div>
            <h3 className="text-2xl font-bold">AI-Powered Smart Features</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card bg-gradient-to-br from-secondary/10 to-secondary/5 shadow-xl border-2 border-secondary/30 hover:-translate-y-2 transition-all duration-300">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                    <Bot size={32} />
                  </div>
                  <h4 className="font-bold text-xl">
                    AI Construction Assistant
                  </h4>
                </div>
                <p className="text-sm opacity-70 mb-4">
                  Get instant cost estimates and material calculations powered
                  by Google Gemini AI
                </p>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex gap-2">
                    <Sparkles
                      size={16}
                      className="text-secondary mt-0.5 flex-shrink-0"
                    />
                    <span>Accurate cost breakdown in PKR</span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles
                      size={16}
                      className="text-secondary mt-0.5 flex-shrink-0"
                    />
                    <span>Material quantity estimates</span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles
                      size={16}
                      className="text-secondary mt-0.5 flex-shrink-0"
                    />
                    <span>Project timeline predictions</span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles
                      size={16}
                      className="text-secondary mt-0.5 flex-shrink-0"
                    />
                    <span>Context-aware chat for follow-ups</span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles
                      size={16}
                      className="text-secondary mt-0.5 flex-shrink-0"
                    />
                    <span>Pakistani market rates (225 or 272 sqft marla)</span>
                  </li>
                </ul>
                <Link
                  to="/ai-estimator"
                  className="btn btn-secondary btn-sm gap-2"
                >
                  <Bot size={16} /> Try AI Assistant
                </Link>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-accent/10 to-accent/5 shadow-xl border-2 border-accent/30 hover:-translate-y-2 transition-all duration-300">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                    <Search size={32} />
                  </div>
                  <h4 className="font-bold text-xl">Find a Pro with AI</h4>
                </div>
                <p className="text-sm opacity-70 mb-4">
                  Smart contractor matching using AI-powered search and
                  filtering system
                </p>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex gap-2">
                    <Star
                      size={16}
                      className="text-accent mt-0.5 flex-shrink-0"
                    />
                    <span>Filter by skills, experience, and ratings</span>
                  </li>
                  <li className="flex gap-2">
                    <Star
                      size={16}
                      className="text-accent mt-0.5 flex-shrink-0"
                    />
                    <span>Real-time availability status</span>
                  </li>
                  <li className="flex gap-2">
                    <Star
                      size={16}
                      className="text-accent mt-0.5 flex-shrink-0"
                    />
                    <span>Location-based matching</span>
                  </li>
                  <li className="flex gap-2">
                    <Star
                      size={16}
                      className="text-accent mt-0.5 flex-shrink-0"
                    />
                    <span>Verified credentials and reviews</span>
                  </li>
                  <li className="flex gap-2">
                    <Star
                      size={16}
                      className="text-accent mt-0.5 flex-shrink-0"
                    />
                    <span>Instant booking capability</span>
                  </li>
                </ul>
                <Link to="/find-pro" className="btn btn-accent btn-sm gap-2">
                  <Search size={16} /> Find Pro with AI
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary to-secondary text-primary-content rounded-2xl p-10">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Start Your Project?
          </h3>
          <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust BuildLink for
            secure, transparent construction services.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              to="/contractors"
              className="btn btn-lg bg-white text-primary hover:bg-white/90 border-none gap-2"
            >
              <Search size={20} /> Find Contractors Now
            </Link>
            <Link
              to="/ai-estimator"
              className="btn btn-lg btn-outline border-2 border-white text-white hover:bg-white hover:text-primary gap-2"
            >
              <Bot size={20} /> Get Free Estimate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
