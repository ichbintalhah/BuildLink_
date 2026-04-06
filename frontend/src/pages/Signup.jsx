import {
  useState,
  useContext,
  useEffect,
  useRef,
  useTransition,
  useCallback,
} from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import {
  Plus,
  Trash2,
  User,
  Hammer,
  Users,
  Briefcase,
  ArrowLeft,
  Upload,
  AlertCircle,
  Check,
  ShieldCheck,
  ShieldX,
  Loader2,
  Eye,
  EyeOff,
  X,
  Phone,
  MessageSquare,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";

// ─── OTP Spark Plan Protection Helpers ───────────────────────────────────────
const OTP_STORAGE_KEY = "buildlink_otp_tracker";
const RESEND_COOLDOWN = 60; // seconds

function getOtpTracker() {
  try {
    const raw = localStorage.getItem(OTP_STORAGE_KEY);
    if (!raw)
      return { date: new Date().toDateString(), lastTimestamp: 0, numbers: {} };
    const tracker = JSON.parse(raw);
    if (tracker.date !== new Date().toDateString()) {
      return { date: new Date().toDateString(), lastTimestamp: 0, numbers: {} };
    }
    return tracker;
  } catch {
    return { date: new Date().toDateString(), lastTimestamp: 0, numbers: {} };
  }
}

function saveOtpTracker(tracker) {
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(tracker));
}

function canRequestOtp(phoneNumber) {
  const tracker = getOtpTracker();
  // Prevent repeated requests for same number within cooldown
  const lastForNumber = tracker.numbers[phoneNumber] || 0;
  const secondsSinceLast = (Date.now() - lastForNumber) / 1000;
  if (secondsSinceLast < RESEND_COOLDOWN) {
    const wait = Math.ceil(RESEND_COOLDOWN - secondsSinceLast);
    return {
      allowed: false,
      reason: `Please wait ${wait}s before requesting another OTP for this number.`,
    };
  }
  return { allowed: true };
}

function recordOtpRequest(phoneNumber) {
  const tracker = getOtpTracker();
  tracker.lastTimestamp = Date.now();
  tracker.numbers[phoneNumber] = Date.now();
  saveOtpTracker(tracker);
}
// ─────────────────────────────────────────────────────────────────────────────

const Signup = () => {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ─── Phone OTP State ────────────────────────────────────────────────────────
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const recaptchaVerifierRef = useRef(null);
  const recaptchaWidgetIdRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Core State
  const [role, setRole] = useState("user"); // 'user' or 'contractor'

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    cnic: "",
    address: "",
    location: "",
    confirmPassword: "",
    // Contractor Basics
    skill: "Plumber",
    teamType: "Individual", // Default
    paymentMethod: "EasyPaisa",
    paymentAccount: "",
  });

  // Dynamic Team Members State
  const [teamMembers, setTeamMembers] = useState([{ name: "", skill: "" }]);

  // Picture Upload State
  const [pictures, setPictures] = useState({
    cnicFront: null,
    cnicBack: null,
    selfie: null,
  });

  const [picturePreview, setPicturePreview] = useState({
    cnicFront: null,
    cnicBack: null,
    selfie: null,
  });

  const [uploadingPicture, setUploadingPicture] = useState(null);

  // Identity Verification State
  const [verificationStatus, setVerificationStatus] = useState("idle"); // idle | checking | passed | failed
  const [verificationResult, setVerificationResult] = useState(null);

  // Reset verification when pictures change
  const resetVerification = () => {
    setVerificationStatus("idle");
    setVerificationResult(null);
  };

  // Handle Text Inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-set Team mode when Heavy Duty Construction is selected
    if (name === "skill" && value === "Heavy Duty Construction") {
      setFormData((prev) => ({ ...prev, [name]: value, teamType: "Team" }));
      // Initialize 5 empty team member rows
      setTeamMembers([
        { name: "", skill: "" },
        { name: "", skill: "" },
        { name: "", skill: "" },
        { name: "", skill: "" },
        { name: "", skill: "" },
      ]);
    } else if (name === "skill" && value !== "Heavy Duty Construction") {
      // Reset to 1 team member for other skills
      setTeamMembers([{ name: "", skill: "" }]);
    }
  };

  // Handle Picture Upload with Preview
  const handlePictureUpload = (e, pictureType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (3MB = 3145728 bytes)
    const MAX_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_SIZE) {
      toast.error(
        `File size must be less than 3MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
      return;
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    // Store file and create preview
    setPictures({ ...pictures, [pictureType]: file });

    // Reset verification if cnicFront or selfie changed
    if (pictureType === "cnicFront" || pictureType === "selfie") {
      resetVerification();
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPicturePreview({ ...picturePreview, [pictureType]: reader.result });
    };
    reader.readAsDataURL(file);

    toast.success(
      `${pictureType === "cnicFront" ? "CNIC Front" : pictureType === "cnicBack" ? "CNIC Back" : "Selfie"} photo uploaded`,
    );
  };

  const removePicture = (pictureType) => {
    setPictures({ ...pictures, [pictureType]: null });
    setPicturePreview({ ...picturePreview, [pictureType]: null });

    // Reset verification if cnicFront or selfie removed
    if (pictureType === "cnicFront" || pictureType === "selfie") {
      resetVerification();
    }
  };

  // Handle Identity Verification (CNIC vs Selfie)
  const handleVerifyIdentity = async () => {
    if (!pictures.cnicFront || !pictures.selfie) {
      toast.error("Please upload both CNIC front photo and selfie first.");
      return;
    }

    setVerificationStatus("checking");
    setVerificationResult(null);

    try {
      const verifyData = new FormData();
      verifyData.append("cnicFront", pictures.cnicFront);
      verifyData.append("selfie", pictures.selfie);

      const { data } = await api.post("/auth/verify-identity", verifyData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setVerificationStatus("passed");
      setVerificationResult(data);
      toast.success(
        `Identity verified! Confidence: ${Math.round(data.confidence * 100)}%`,
        { duration: 5000 },
      );
    } catch (error) {
      const data = error.response?.data;
      setVerificationStatus("failed");
      setVerificationResult(
        data || { reason: "Verification service unavailable" },
      );
      toast.error(
        `Verification failed: ${data?.reason || "Please try again with clearer photos."}`,
        { duration: 6000 },
      );
    }
  };

  // Handle Team Status Toggle
  const handleTeamTypeSelect = (type) => {
    setFormData({ ...formData, teamType: type });
  };

  // Handle Team Member Inputs
  const handleTeamChange = (index, field, value) => {
    const updatedTeam = [...teamMembers];
    updatedTeam[index][field] = value;
    setTeamMembers(updatedTeam);
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: "", skill: "" }]);
  };

  const removeTeamMember = (index) => {
    // Prevent removing if Heavy Duty Construction and less than 5 members
    if (
      formData.skill === "Heavy Duty Construction" &&
      teamMembers.length <= 5
    ) {
      toast.error("Heavy Duty Construction requires at least 5 team members");
      return;
    }
    const updatedTeam = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(updatedTeam);
  };

  // SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Enforce minimum 8-character password length
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate phone OTP verification
    if (!phoneVerified) {
      toast.error(
        "Please verify your phone number with OTP before signing up.",
      );
      return;
    }

    // Validate picture uploads (required for both users and contractors)
    if (!pictures.cnicFront || !pictures.cnicBack || !pictures.selfie) {
      toast.error(
        "All three pictures (CNIC front, CNIC back, and Selfie) are required",
      );
      return;
    }

    // Block contractor signup if identity verification hasn't passed
    if (role === "contractor" && verificationStatus !== "passed") {
      toast.error(
        'Please verify your identity first by clicking the "Verify Identity" button.',
        { duration: 5000 },
      );
      return;
    }

    // Validate Heavy Duty Construction requires minimum 5 team members
    if (role === "contractor" && formData.skill === "Heavy Duty Construction") {
      const validTeamMembers = teamMembers.filter(
        (member) => member.name.trim() !== "" && member.skill.trim() !== "",
      );
      if (validTeamMembers.length < 5) {
        toast.error(
          "Heavy Duty Construction requires at least 5 team members for signup",
        );
        return;
      }
    }

    // Prepare FormData for file upload
    const formDataWithFiles = new FormData();

    // Add text fields
    const { confirmPassword, ...rest } = formData;
    Object.keys(rest).forEach((key) => {
      formDataWithFiles.append(key, rest[key]);
    });

    formDataWithFiles.append("role", role);

    // Add picture files
    formDataWithFiles.append("cnicFront", pictures.cnicFront);
    formDataWithFiles.append("cnicBack", pictures.cnicBack);
    formDataWithFiles.append("selfie", pictures.selfie);

    if (role === "contractor") {
      const contractorDetailsStr = JSON.stringify({
        skill: formData.skill,
        teamType: formData.teamType,
        paymentMethod: formData.paymentMethod,
        paymentAccount: formData.paymentAccount,
        teamMembers: formData.teamType === "Team" ? teamMembers : [],
      });
      formDataWithFiles.append("contractorDetails", contractorDetailsStr);
    }

    try {
      setSubmitting(true);
      await signup(formDataWithFiles);
      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      const data = error.response?.data;

      // Handle AI face-verification failure specifically
      if (error.response?.status === 401 && data?.reason) {
        toast.error(`Identity verification failed: ${data.reason}`, {
          duration: 6000,
        });
      } else {
        const errorMsg =
          data?.message ||
          "Signup failed. Please verify your details and try again.";
        toast.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Initialize RecaptchaVerifier (once) ──────────────────────────────────
  useEffect(() => {
    // Only create if not already created
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {
              // reCAPTCHA solved — allow OTP request
            },
            "expired-callback": () => {
              setOtpError("reCAPTCHA expired. Please try again.");
            },
          },
        );
      } catch (err) {
        console.error("RecaptchaVerifier init error:", err);
      }
    }

    return () => {
      // Cleanup recaptcha on unmount
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (_) {}
        recaptchaVerifierRef.current = null;
      }
      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // ─── Resend Countdown Timer ─────────────────────────────────────────────────
  const startResendCountdown = useCallback(() => {
    setResendCountdown(RESEND_COOLDOWN);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // ─── Request OTP ────────────────────────────────────────────────────────────
  const requestOTP = () => {
    setOtpError("");
    setOtpSuccess("");

    const phone = formData.phone.trim();

    // Format validation: accept +92XXXXXXXXXX or 03XXXXXXXXX
    const intlFormat = /^\+92\d{10}$/;
    const localFormat = /^0\d{10}$/;

    let formattedPhone = phone;
    if (localFormat.test(phone)) {
      formattedPhone = "+92" + phone.slice(1);
    } else if (!intlFormat.test(phone)) {
      setOtpError(
        "Enter a valid Pakistan phone number (e.g. 03001234567 or +923001234567)",
      );
      return;
    }

    // Spark plan protection
    const check = canRequestOtp(formattedPhone);
    if (!check.allowed) {
      setOtpError(check.reason);
      return;
    }

    if (!recaptchaVerifierRef.current) {
      setOtpError("reCAPTCHA not ready. Please refresh the page.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await signInWithPhoneNumber(
          auth,
          formattedPhone,
          recaptchaVerifierRef.current,
        );
        setConfirmationResult(result);
        setOtpSent(true);
        setOtpSuccess("OTP sent to " + formattedPhone);
        recordOtpRequest(formattedPhone);
        startResendCountdown();
        toast.success("OTP sent successfully!");
      } catch (err) {
        console.error("OTP request error:", err);
        const code = err.code;
        if (code === "auth/invalid-phone-number") {
          setOtpError("Invalid phone number format.");
        } else if (code === "auth/too-many-requests") {
          setOtpError("Too many requests. Please try again later.");
        } else if (code === "auth/quota-exceeded") {
          setOtpError("SMS quota exceeded. Please try again tomorrow.");
        } else {
          setOtpError(err.message || "Failed to send OTP. Please try again.");
        }

        // Reset recaptcha so user can retry
        try {
          if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
          }
          recaptchaVerifierRef.current = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
              callback: () => {},
              "expired-callback": () =>
                setOtpError("reCAPTCHA expired. Please try again."),
            },
          );
        } catch (_) {}
      }
    });
  };

  // ─── Auto-verify OTP when 6 digits entered ─────────────────────────────────
  useEffect(() => {
    if (
      otp.length === 6 &&
      confirmationResult &&
      !phoneVerified &&
      !verifyingOtp
    ) {
      verifyOTP(otp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, confirmationResult, phoneVerified, verifyingOtp]);

  const verifyOTP = async (code) => {
    setOtpError("");
    setVerifyingOtp(true);
    try {
      await confirmationResult.confirm(code);
      setPhoneVerified(true);
      setOtpSuccess("Phone number verified successfully!");
      toast.success("Phone verified!");
      // Sign out from Firebase Auth — we only need the verification,
      // actual app auth is handled by our backend
      try {
        await auth.signOut();
      } catch (_) {}
    } catch (err) {
      console.error("OTP verify error:", err);
      setOtp("");
      if (err.code === "auth/invalid-verification-code") {
        setOtpError("Invalid OTP. Please check and try again.");
      } else if (err.code === "auth/code-expired") {
        setOtpError("OTP expired. Please request a new one.");
      } else {
        setOtpError("Verification failed. Please try again.");
      }
    } finally {
      setVerifyingOtp(false);
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

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4 py-10 relative">
      {/* Invisible reCAPTCHA container — must be in the DOM */}
      <div id="recaptcha-container" />

      {/* Subtle dot-grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.25] pointer-events-none" />

      {/* Go Back to Home Button - Top Left */}
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

      <div className="w-full max-w-4xl relative z-10">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BrandLogo
              iconSize={32}
              textSize="text-2xl"
              iconClassName="text-primary"
              textClassName="text-primary"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-base-content tracking-tight">
            Create Account
          </h2>
          <p className="text-base-content/50 mt-2">
            Join BuildLink as a Homeowner or Professional
          </p>
        </div>

        <div className="bg-base-100 border border-base-200 rounded-2xl shadow-2xl shadow-base-content/5 p-6 sm:p-10">
          {/* Role Toggle - Modern Interactive Selection */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest">
                Select your role
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`
                  group relative px-6 sm:px-8 py-5 sm:py-6 rounded-2xl font-bold text-lg
                  transition-all duration-300 ease-out overflow-hidden
                  flex items-center justify-center gap-3
                  ${
                    role === "user"
                      ? "bg-gradient-to-br from-primary to-primary-focus text-white shadow-xl shadow-primary/40 scale-105"
                      : "bg-base-200 text-base-content hover:bg-base-300 border-2 border-transparent hover:border-primary/30"
                  }
                `}
                aria-pressed={role === "user"}
              >
                {/* Shine effect on active */}
                {role === "user" && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></span>
                )}
                <User
                  size={24}
                  className={`transition-transform duration-300 ${
                    role === "user" ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                <span className="relative z-10">Homeowner</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("contractor")}
                className={`
                  group relative px-6 sm:px-8 py-5 sm:py-6 rounded-2xl font-bold text-lg
                  transition-all duration-300 ease-out overflow-hidden
                  flex items-center justify-center gap-3
                  ${
                    role === "contractor"
                      ? "bg-gradient-to-br from-success to-success-focus text-white shadow-xl shadow-success/40 scale-105"
                      : "bg-base-200 text-base-content hover:bg-base-300 border-2 border-transparent hover:border-success/30"
                  }
                `}
                aria-pressed={role === "contractor"}
              >
                {/* Shine effect on active */}
                {role === "contractor" && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></span>
                )}
                <Hammer
                  size={24}
                  className={`transition-transform duration-300 ${
                    role === "contractor"
                      ? "scale-110 rotate-45"
                      : "group-hover:scale-110 group-hover:rotate-45"
                  }`}
                />
                <span className="relative z-10">Professional</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Full Name</span>
                </label>
                <input
                  name="fullName"
                  type="text"
                  placeholder="Name"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Email</span>
                </label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    className="input input-bordered w-full pr-10"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {formData.email && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setFormData({ ...formData, email: "" })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors duration-200"
                      aria-label="Clear email"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Password</span>
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="input input-bordered w-full pr-[4.5rem] hide-native-password-toggle"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  {formData.password && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setFormData({ ...formData, password: "" })}
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
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Confirm Password</span>
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    className="input input-bordered w-full pr-[4.5rem] hide-native-password-toggle"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  {formData.confirmPassword && (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() =>
                        setFormData({ ...formData, confirmPassword: "" })
                      }
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors duration-200"
                      aria-label="Clear confirm password"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors duration-200"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* ─── Phone Number + OTP Verification ─────────────────────── */}
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-bold flex items-center gap-1.5">
                    <Phone size={15} /> Phone Number
                    {phoneVerified && (
                      <span className="badge badge-success badge-sm gap-1 ml-2">
                        <Check size={12} /> Verified
                      </span>
                    )}
                  </span>
                </label>

                {/* Phone input + Send OTP button */}
                <div className="flex gap-2">
                  <input
                    name="phone"
                    type="tel"
                    placeholder="03001234567 or +923001234567"
                    className={`input input-bordered flex-1 ${phoneVerified ? "input-success" : ""}`}
                    onChange={handleChange}
                    disabled={phoneVerified}
                    required
                  />
                  {!phoneVerified && (
                    <button
                      type="button"
                      onClick={requestOTP}
                      disabled={
                        isPending ||
                        !formData.phone.trim() ||
                        resendCountdown > 0
                      }
                      className="btn btn-primary min-w-[130px] gap-1.5"
                    >
                      {isPending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Sending...
                        </>
                      ) : resendCountdown > 0 ? (
                        `Resend (${resendCountdown}s)`
                      ) : otpSent ? (
                        "Resend OTP"
                      ) : (
                        <>
                          <MessageSquare size={15} />
                          Send OTP
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* OTP Input — shown after OTP is sent, hidden after verified */}
                {otpSent && !phoneVerified && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="label pb-1">
                      <span className="label-text text-sm font-semibold">
                        Enter 6-digit OTP
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="------"
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                          setOtp(val);
                          setOtpError("");
                        }}
                        className={`input input-bordered w-full text-center text-2xl tracking-[0.5em] font-mono ${
                          verifyingOtp ? "opacity-60" : ""
                        }`}
                        disabled={verifyingOtp}
                        autoFocus
                      />
                      {verifyingOtp && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2
                            size={20}
                            className="animate-spin text-primary"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-base-content/40 mt-1">
                      OTP will auto-verify when all 6 digits are entered
                    </p>
                  </div>
                )}

                {/* OTP Errors & Success */}
                {otpError && (
                  <div className="flex items-center gap-2 mt-2 text-error text-sm">
                    <AlertCircle size={15} />
                    {otpError}
                  </div>
                )}
                {otpSuccess && !otpError && (
                  <div className="flex items-center gap-2 mt-2 text-success text-sm">
                    <Check size={15} />
                    {otpSuccess}
                  </div>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">CNIC</span>
                </label>
                <input
                  name="cnic"
                  type="text"
                  placeholder="35202-1234567-1"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Address</span>
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="House 123, Street 4, Lahore"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">
                    Location (City/Area)
                  </span>
                </label>
                <input
                  name="location"
                  type="text"
                  placeholder="e.g. Lahore, DHA"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {role === "contractor"
                    ? "Enter your nearest area (e.g., Samanabad, Chuburji, Garhi Shahu) so customers can find you easily."
                    : "Enter your nearest area (e.g., Samanabad, Chuburji, Garhi Shahu) so we can connect you with nearby professionals."}
                </p>
              </div>
            </div>

            {/* PICTURE UPLOADS - Required for both Users and Contractors */}
            <div className="mt-10 pt-8 border-t border-base-200 animate-in fade-in slide-in-from-top-4 duration-500">
              <div
                className="alert bg-info/10 border border-info/20 rounded-xl mb-6"
                role="alert"
              >
                <AlertCircle size={20} className="text-info" />
                <span>
                  <strong>Picture Requirements:</strong> All three pictures must
                  be clear, well-lit, and under 3MB each.
                </span>
              </div>

              <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                <Upload className="text-success" size={22} /> Verification
                Pictures
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CNIC Front */}
                <div className="form-control border-2 border-dashed border-base-300 rounded-lg p-4 hover:border-primary transition-colors">
                  <label className="label">
                    <span className="label-text font-bold text-sm">
                      CNIC Front
                    </span>
                    {pictures.cnicFront && (
                      <Check size={20} className="text-success" />
                    )}
                  </label>
                  {picturePreview.cnicFront ? (
                    <div className="relative w-full mb-2">
                      <img
                        src={picturePreview.cnicFront}
                        alt="CNIC Front Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePicture("cnicFront")}
                        className="btn btn-sm btn-circle btn-error absolute top-1 right-1 text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload size={24} className="text-base-400 mb-1" />
                        <p className="text-xs text-base-500">Click to upload</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handlePictureUpload(e, "cnicFront")}
                      />
                    </label>
                  )}
                  <p className="text-xs text-base-500 mt-2">
                    📸 Clear front side of CNIC
                  </p>
                </div>

                {/* CNIC Back */}
                <div className="form-control border-2 border-dashed border-base-300 rounded-lg p-4 hover:border-primary transition-colors">
                  <label className="label">
                    <span className="label-text font-bold text-sm">
                      CNIC Back
                    </span>
                    {pictures.cnicBack && (
                      <Check size={20} className="text-success" />
                    )}
                  </label>
                  {picturePreview.cnicBack ? (
                    <div className="relative w-full mb-2">
                      <img
                        src={picturePreview.cnicBack}
                        alt="CNIC Back Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePicture("cnicBack")}
                        className="btn btn-sm btn-circle btn-error absolute top-1 right-1 text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload size={24} className="text-base-400 mb-1" />
                        <p className="text-xs text-base-500">Click to upload</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handlePictureUpload(e, "cnicBack")}
                      />
                    </label>
                  )}
                  <p className="text-xs text-base-500 mt-2">
                    📸 Clear back side of CNIC
                  </p>
                </div>

                {/* Selfie */}
                <div className="form-control border-2 border-dashed border-base-300 rounded-lg p-4 hover:border-primary transition-colors">
                  <label className="label">
                    <span className="label-text font-bold text-sm">Selfie</span>
                    {pictures.selfie && (
                      <Check size={20} className="text-success" />
                    )}
                  </label>
                  {picturePreview.selfie ? (
                    <div className="relative w-full mb-2">
                      <img
                        src={picturePreview.selfie}
                        alt="Selfie Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePicture("selfie")}
                        className="btn btn-sm btn-circle btn-error absolute top-1 right-1 text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload size={24} className="text-base-400 mb-1" />
                        <p className="text-xs text-base-500">Click to upload</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handlePictureUpload(e, "selfie")}
                      />
                    </label>
                  )}
                  <p className="text-xs text-base-500 mt-2">
                    🤳 Clear face photo (selfie)
                  </p>
                </div>
              </div>

              {/* Identity Verification Button & Status — Contractors only */}
              {role === "contractor" && (
                <div className="mt-6 p-4 border-2 border-dashed border-base-300 rounded-xl bg-base-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {verificationStatus === "passed" ? (
                        <ShieldCheck size={28} className="text-success" />
                      ) : verificationStatus === "failed" ? (
                        <ShieldX size={28} className="text-error" />
                      ) : (
                        <ShieldCheck
                          size={28}
                          className="text-base-content/30"
                        />
                      )}
                      <div>
                        <p className="font-bold text-sm">
                          AI Identity Verification
                        </p>
                        <p className="text-xs text-base-content/50">
                          {verificationStatus === "idle" &&
                            "Compare your CNIC photo with your selfie before signup"}
                          {verificationStatus === "checking" &&
                            "Analyzing your photos with AI…"}
                          {verificationStatus === "passed" &&
                            `✅ Verified — ${Math.round((verificationResult?.confidence || 0) * 100)}% confidence`}
                          {verificationStatus === "failed" &&
                            `❌ ${verificationResult?.reason || "Photos do not match"}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyIdentity}
                      disabled={
                        !pictures.cnicFront ||
                        !pictures.selfie ||
                        verificationStatus === "checking"
                      }
                      className={`btn btn-sm gap-2 min-w-[160px] ${
                        verificationStatus === "passed"
                          ? "btn-success text-white"
                          : verificationStatus === "failed"
                            ? "btn-error text-white"
                            : "btn-primary"
                      }`}
                    >
                      {verificationStatus === "checking" ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Verifying…
                        </>
                      ) : verificationStatus === "passed" ? (
                        <>
                          <ShieldCheck size={16} />
                          Verified ✓
                        </>
                      ) : verificationStatus === "failed" ? (
                        <>
                          <ShieldX size={16} />
                          Retry Verification
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          Verify Identity
                        </>
                      )}
                    </button>
                  </div>

                  {verificationStatus === "passed" &&
                    verificationResult?.reason && (
                      <div className="mt-3 p-2 bg-success/10 border border-success/20 rounded-lg">
                        <p className="text-xs text-success">
                          <strong>AI Result:</strong>{" "}
                          {verificationResult.reason}
                        </p>
                      </div>
                    )}

                  {verificationStatus === "failed" &&
                    verificationResult?.reason && (
                      <div className="mt-3 p-2 bg-error/10 border border-error/20 rounded-lg">
                        <p className="text-xs text-error">
                          <strong>Reason:</strong> {verificationResult.reason}
                        </p>
                        <p className="text-xs text-error/70 mt-1">
                          Tip: Ensure your selfie is well-lit and matches the
                          face on your CNIC.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* CONTRACTOR SPECIFIC FIELDS */}
            {role === "contractor" && (
              <div className="mt-10 pt-8 border-t border-base-200 animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                  <Briefcase className="text-primary" size={22} /> Professional
                  Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">
                        Skill / Trade
                      </span>
                    </label>
                    <select
                      name="skill"
                      className="select select-bordered w-full"
                      onChange={handleChange}
                      value={formData.skill}
                    >
                      <option>Plumber</option>
                      <option>Electrician</option>
                      <option>Mason</option>
                      <option>Carpenter</option>
                      <option>Painter</option>
                      <option>Welder</option>
                      <option>Glass Worker</option>
                      <option>HVAC</option>
                      <option>Helper</option>
                      <option>Heavy Duty Construction</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">Work Type</span>
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        className={`btn flex-1 ${
                          formData.teamType === "Individual"
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                        onClick={() => handleTeamTypeSelect("Individual")}
                        disabled={formData.skill === "Heavy Duty Construction"}
                      >
                        <User size={18} /> Individual
                      </button>
                      <button
                        type="button"
                        className={`btn flex-1 ${
                          formData.teamType === "Team"
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                        onClick={() => handleTeamTypeSelect("Team")}
                      >
                        <Users size={18} /> Team
                      </button>
                    </div>
                  </div>
                </div>

                {/* Heavy Duty Construction Warning */}
                {formData.skill === "Heavy Duty Construction" && (
                  <div className="alert alert-warning mb-4" role="alert">
                    <AlertCircle size={20} />
                    <span>
                      <strong>Heavy Duty Construction:</strong> You must add at
                      least 5 team members to complete registration.
                    </span>
                  </div>
                )}

                {/* Team Members Section */}
                {formData.teamType === "Team" && (
                  <div className="bg-base-200 p-4 rounded-xl mb-4">
                    <label className="label font-bold">
                      Team Members
                      {formData.skill === "Heavy Duty Construction" && (
                        <span className="badge badge-warning">
                          Minimum 5 required
                        </span>
                      )}
                    </label>
                    {teamMembers.map((member, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Name"
                          className="input input-bordered flex-1"
                          value={member.name}
                          onChange={(e) =>
                            handleTeamChange(index, "name", e.target.value)
                          }
                          required
                        />
                        <select
                          className="select select-bordered flex-1"
                          value={member.skill}
                          onChange={(e) =>
                            handleTeamChange(index, "skill", e.target.value)
                          }
                          required
                        >
                          <option value="" disabled>
                            Select Skill
                          </option>
                          <option>Plumber</option>
                          <option>Electrician</option>
                          <option>Mason</option>
                          <option>Carpenter</option>
                          <option>Painter</option>
                          <option>Welder</option>
                          <option>Glass Worker</option>
                          <option>HVAC</option>
                          <option>Helper</option>
                          <option>Heavy Machinery Operator</option>
                          <option>Civil Engineer</option>
                          <option>Steel Fixer</option>
                          <option>Crane Operator</option>
                        </select>
                        {((formData.skill === "Heavy Duty Construction" &&
                          index >= 5) ||
                          (formData.skill !== "Heavy Duty Construction" &&
                            index > 0)) && (
                          <button
                            type="button"
                            className="btn btn-square btn-error text-white"
                            onClick={() => removeTeamMember(index)}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost gap-2 mt-2"
                      onClick={addTeamMember}
                    >
                      <Plus size={16} /> Add Member
                    </button>
                  </div>
                )}

                {/* Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">
                        Payment Method
                      </span>
                    </label>
                    <select
                      name="paymentMethod"
                      className="select select-bordered w-full"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      required
                    >
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="SadaPay">SadaPay</option>
                      <option value="NayaPay">NayaPay</option>
                      <option value="Bank Account">Bank Account</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-secondary">
                        {formData.paymentMethod === "Bank Account"
                          ? "IBAN Number"
                          : `${formData.paymentMethod} Phone Number`}
                      </span>
                    </label>
                    <input
                      name="paymentAccount"
                      type="text"
                      placeholder={
                        formData.paymentMethod === "Bank Account"
                          ? "PK36MEZN0000000001234567890"
                          : "0300-1234567"
                      }
                      className="input input-bordered w-full"
                      value={formData.paymentAccount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* HOMEOWNER PAYMENT DETAILS */}
            {role === "user" && (
              <div className="mt-10 pt-8 border-t border-base-200 animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                  <Briefcase className="text-primary" size={22} /> Payment
                  Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">
                        Payment Method
                      </span>
                    </label>
                    <select
                      name="paymentMethod"
                      className="select select-bordered w-full"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      required
                    >
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="SadaPay">SadaPay</option>
                      <option value="NayaPay">NayaPay</option>
                      <option value="Bank Account">Bank Account</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-secondary">
                        {formData.paymentMethod === "Bank Account"
                          ? "IBAN Number"
                          : `${formData.paymentMethod} Phone Number`}
                      </span>
                    </label>
                    <input
                      name="paymentAccount"
                      type="text"
                      placeholder={
                        formData.paymentMethod === "Bank Account"
                          ? "PK36MEZN0000000001234567890"
                          : "0300-1234567"
                      }
                      className="input input-bordered w-full"
                      value={formData.paymentAccount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn w-full h-12 text-base font-bold rounded-xl border-0 bg-gradient-to-r from-primary to-primary-focus text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:brightness-110 active:scale-[0.98] transition-all duration-300 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                submitting ||
                !phoneVerified ||
                !pictures.cnicFront ||
                !pictures.cnicBack ||
                !pictures.selfie ||
                (role === "contractor" && verificationStatus !== "passed")
              }
            >
              {submitting
                ? "Creating account..."
                : !phoneVerified
                  ? "Verify Phone Number to Continue"
                  : !pictures.cnicFront ||
                      !pictures.cnicBack ||
                      !pictures.selfie
                    ? "Upload All Required Pictures"
                    : role === "contractor" && verificationStatus !== "passed"
                      ? "Verify Identity to Continue"
                      : role === "contractor"
                        ? "Register as Contractor"
                        : "Register as Homeowner"}
            </button>
          </form>

          <p className="text-center mt-6 text-base-content/50 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-bold hover:underline underline-offset-4 transition-all duration-300"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
