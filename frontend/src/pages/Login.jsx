import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api"; // Import API
import {
  Mail,
  Lock,
  Loader2,
  KeyRound,
  ArrowLeft,
  Shield,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = Send OTP, 2 = Verify & Reset
  const [forgotLoading, setForgotLoading] = useState(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("✓ Login successful! Welcome back");
      navigate("/");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Login failed. Please check your credentials";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut: Ctrl+Home or Cmd+Home to go home
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Home") {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // --- FORGOT PASSWORD HANDLERS ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      toast.success(`OTP sent to ${forgotEmail}`);
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    // ✅ Enforce minimum 8-character password length
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setForgotLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: forgotEmail,
        otp,
        newPassword,
      });
      toast.success("Password Reset Successful! Please Login.");
      setShowForgotModal(false);
      setStep(1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset Failed");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ===== LEFT BRAND PANEL (desktop only) ===== */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary via-primary to-blue-900">
        {/* Decorative blurred circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white w-full">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <BrandLogo
                iconSize={36}
                textSize="text-3xl"
                iconClassName="text-white"
                textClassName="text-white"
              />
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-4">
              Build with
              <br />
              confidence.
            </h1>
            <p className="text-lg text-white/70 leading-relaxed max-w-sm">
              Pakistan&apos;s trusted platform for connecting homeowners with
              verified construction professionals.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="font-bold">Escrow Based Protection</h3>
                <p className="text-white/60 text-sm">
                  Payments secured until work is verified
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 className="font-bold">CNIC Verified</h3>
                <p className="text-white/60 text-sm">
                  Every professional is identity-verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT FORM PANEL ===== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative bg-base-100">
        {/* Subtle dot-grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.25] pointer-events-none" />

        {/* Go Back to Home Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-5 left-5 flex items-center gap-2 text-base-content/50 hover:text-primary text-sm font-medium transition-all duration-300 group z-10"
          aria-label="Go back to home page"
          title="Return to home (Ctrl+Home)"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform duration-300"
          />
          <span className="hidden sm:inline">Home</span>
        </button>

        <div className="w-full max-w-[420px] relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2">
              <BrandLogo
                iconSize={28}
                textSize="text-2xl"
                iconClassName="text-primary"
                textClassName="text-primary"
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
              Welcome Back
            </h2>
            <p className="text-base-content/50 mt-2">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-base-100 border border-base-200 rounded-2xl shadow-2xl shadow-base-content/5 p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-semibold text-sm">
                    Email
                  </span>
                </label>
                <div className="relative group">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30 group-focus-within:text-primary transition-colors duration-300"
                    size={18}
                  />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="input input-bordered w-full pl-11 pr-10 h-12 rounded-xl bg-base-200/40 border-base-300/60 focus:bg-base-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {email && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setEmail("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors duration-200"
                      aria-label="Clear email"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text font-semibold text-sm">
                    Password
                  </span>
                </label>
                <div className="relative group">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30 group-focus-within:text-primary transition-colors duration-300"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="input input-bordered w-full pl-11 pr-[4.5rem] h-12 rounded-xl bg-base-200/40 border-base-300/60 focus:bg-base-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 hide-native-password-toggle"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {password && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setPassword("")}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors duration-200"
                      aria-label="Clear password"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors duration-200"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-sm text-primary/70 hover:text-primary font-medium transition-colors duration-300"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="btn w-full h-12 text-base font-bold rounded-xl border-0 bg-gradient-to-r from-primary to-primary-focus text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:brightness-110 active:scale-[0.98] transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          {/* Bottom Link */}
          <p className="text-center mt-8 text-base-content/50 text-sm">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="text-primary font-bold hover:underline underline-offset-4 transition-all duration-300"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* ===== FORGOT PASSWORD MODAL ===== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl border border-base-200 p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              <KeyRound className="text-primary" size={22} /> Reset Password
            </h3>

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-sm text-base-content/60">
                  Enter your registered email address. We will send a
                  verification code to your inbox.
                </p>
                <input
                  type="email"
                  placeholder="Enter Email"
                  className="input input-bordered w-full rounded-xl"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost flex-1 rounded-xl"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 rounded-xl"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm text-base-content/60">
                  Enter the 6-digit OTP sent to <b>{forgotEmail}</b> and your
                  new password.
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  className="input input-bordered w-full text-center text-lg tracking-widest rounded-xl"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    className="input input-bordered w-full pr-11 rounded-xl hide-native-password-toggle"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors duration-200"
                    aria-label={
                      showNewPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost flex-1 rounded-xl"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1 rounded-xl"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Resetting..." : "Set New Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
