import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { CreditCard, Upload, X, Copy, Check } from "lucide-react";

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [preview, setPreview] = useState(null);
  const [ibanCopied, setIbanCopied] = useState(false);

  // Payment details from settings
  const [settings, setSettings] = useState({
    ibanNumber: "",
    bankName: "BuildLink Bank",
    accountHolderName: "BuildLink Admin",
  });

  // Fetch admin bank details from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get("/dashboard/settings");
        if (data.ibanNumber) {
          setSettings({
            ibanNumber: data.ibanNumber,
            bankName: data.bankName || "BuildLink Bank",
            accountHolderName: data.accountHolderName || "BuildLink Admin",
          });
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        // Keep defaults if fetch fails
      } finally {
        setFetchingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const isHeavyDuty =
    booking?.bookingType === "heavy-duty-construction" &&
    booking?.paymentSchedule &&
    booking.paymentSchedule.length > 0;
  const currentMilestoneIndex = booking?.currentMilestone || 0;
  const currentMilestone = isHeavyDuty
    ? booking.paymentSchedule[currentMilestoneIndex]
    : null;
  const payableAmount =
    isHeavyDuty && currentMilestone?.amount
      ? currentMilestone.amount
      : booking.totalPrice;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!preview) {
      toast.error("Please upload a payment screenshot");
      return;
    }

    setLoading(true);
    try {
      await api.put(`/bookings/${booking._id}/payment`, {
        screenshotUrl: preview,
      });

      toast.success("Payment uploaded! Waiting for verification.");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyIban = async () => {
    const iban = (settings.ibanNumber || "").trim();
    if (!iban) {
      toast.error("IBAN is not available yet");
      return;
    }

    try {
      await navigator.clipboard.writeText(iban);
    } catch {
      try {
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = iban;
        tempTextArea.setAttribute("readonly", "");
        tempTextArea.style.position = "absolute";
        tempTextArea.style.left = "-9999px";
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextArea);
      } catch {
        toast.error("Failed to copy IBAN");
        return;
      }
    }

    setIbanCopied(true);
    toast.success("IBAN copied to clipboard");
    setTimeout(() => setIbanCopied(false), 1600);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onClose]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-base-100 p-6 shadow-2xl animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Complete Payment"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
        >
          <X size={20} />
        </button>

        <h3 className="mb-6 text-center text-2xl font-bold">
          Complete Payment
        </h3>
        {isHeavyDuty && (
          <div className="mb-4 text-center text-sm font-semibold text-primary">
            Milestone {currentMilestoneIndex + 1} of{" "}
            {booking.paymentSchedule.length}
          </div>
        )}

        {/* Bank Details */}
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/10 p-4">
          <h4 className="mb-3 flex items-center gap-2 font-bold text-primary">
            <CreditCard size={18} />
            Admin Bank Details
          </h4>

          {fetchingSettings ? (
            <div className="flex justify-center py-4">
              <span className="loading loading-spinner loading-sm text-primary"></span>
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <p>
                <span className="opacity-70">Bank:</span> {settings.bankName}
              </p>
              <p>
                <span className="opacity-70">Title:</span>{" "}
                {settings.accountHolderName}
              </p>

              {/* IBAN Box (Light & Dark Mode Safe) */}
              <div className="mt-3 rounded-lg border border-base-300 bg-base-200 p-3 text-center font-mono text-base-content select-all break-all">
                {settings.ibanNumber || "Loading..."}
              </div>
              <button
                type="button"
                onClick={handleCopyIban}
                disabled={fetchingSettings || !settings.ibanNumber}
                className="btn btn-sm btn-outline w-full mt-2 gap-2"
              >
                {ibanCopied ? <Check size={16} /> : <Copy size={16} />}
                {ibanCopied ? "Copied" : "Copy IBAN"}
              </button>

              <p className="mt-2 text-center text-xs text-primary">
                Transfer <strong>Rs. {payableAmount}</strong> to activate job.
              </p>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label font-bold">Upload Screenshot</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input file-input-bordered w-full"
            />
          </div>

          {preview && (
            <div className="h-32 w-full overflow-hidden rounded-lg border border-base-300">
              <img
                src={preview}
                alt="Payment Proof"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full gap-2"
          >
            {loading ? (
              <span className="loading loading-spinner" />
            ) : (
              <>
                <Upload size={18} />
                Submit Proof
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PaymentModal;
