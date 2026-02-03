import { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { CreditCard, Upload, X } from "lucide-react";

const PaymentModal = ({ booking, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  // Admin Bank Details
  const ADMIN_IBAN = "PK36MEZN0000000123456789";
  const BANK_NAME = "Meezan Bank";
  const ADMIN_NAME = "BuildLink Admin";

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

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-base-100 p-6 shadow-2xl animate-fade-in">
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

        {/* Bank Details */}
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/10 p-4">
          <h4 className="mb-3 flex items-center gap-2 font-bold text-primary">
            <CreditCard size={18} />
            Admin Bank Details
          </h4>

          <div className="space-y-1 text-sm">
            <p>
              <span className="opacity-70">Bank:</span> {BANK_NAME}
            </p>
            <p>
              <span className="opacity-70">Title:</span> {ADMIN_NAME}
            </p>

            {/* IBAN Box (Light & Dark Mode Safe) */}
            <div className="mt-3 rounded-lg border border-base-300 bg-base-200 p-3 text-center font-mono text-base-content select-all break-all">
              {ADMIN_IBAN}
            </div>

            <p className="mt-2 text-center text-xs text-primary">
              Transfer <strong>Rs. {booking.totalPrice}</strong> to activate
              job.
            </p>
          </div>
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
};

export default PaymentModal;
