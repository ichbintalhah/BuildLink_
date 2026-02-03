import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api"; // Import API
import { Mail, Lock, Loader2, KeyRound, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen flex bg-base-100 items-center justify-center p-4 relative">
      {/* Go Back to Home Button - Top Left */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 btn btn-ghost btn-sm gap-2 hover:bg-base-200 focus:outline-2 focus:outline-offset-2 focus:outline-primary transition-colors"
        aria-label="Go back to home page"
        title="Return to home (Ctrl+Home)"
      >
        <ArrowLeft size={18} />
        <span className="hidden sm:inline">Home</span>
      </button>

      <div className="card w-full max-w-sm shadow-2xl bg-base-100 border border-base-200 rounded-3xl">
        <div className="card-body p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-br from-primary to-primary-focus rounded-2xl p-3 mb-4">
              <span className="text-2xl font-bold text-white">BuildLink</span>
            </div>
            <h2 className="text-3xl font-bold text-base-content">
              Welcome Back
            </h2>
            <p className="text-base opacity-60 mt-2">
              Please sign in to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base">
                  Email
                </span>
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-3.5 opacity-40"
                  size={19}
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input input-bordered w-full pl-11 h-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base">
                  Password
                </span>
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-3.5 opacity-40"
                  size={19}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-11 h-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {/* Forgot Password Link */}
              <label className="label">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="label-text-alt link link-hover text-primary font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
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

          <div className="divider opacity-30 my-6">or</div>

          <p className="text-center text-sm text-base-content/70">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="link link-primary font-bold hover:no-underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <KeyRound className="text-primary" /> Reset Password
            </h3>

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-sm opacity-70">
                  Enter your registered email address. We will send a
                  verification code to your inbox.
                </p>
                <input
                  type="email"
                  placeholder="Enter Email"
                  className="input input-bordered w-full"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost flex-1"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-sm opacity-70">
                  Enter the 6-digit OTP sent to <b>{forgotEmail}</b> and your
                  new password.
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  className="input input-bordered w-full text-center text-lg tracking-widest"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="New Password"
                  className="input input-bordered w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
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
