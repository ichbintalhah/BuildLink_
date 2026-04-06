import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Star, X, CheckCircle, AlertCircle, Loader } from "lucide-react";

const ReviewModal = ({
  booking,
  onClose,
  onSuccess,
  fromSatisfaction = false,
}) => {
  const [rating, setRating] = useState(0); // STEP 3: Default to 0 - require selection
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  // STEP 3: Track payment release status for better UI feedback
  const [jobSatisfied, setJobSatisfied] = useState(false);
  const [paymentReleaseStatus, setPaymentReleaseStatus] = useState(null); // "releasing" | "success" | "error"
  const [paymentError, setPaymentError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // STEP 3: Validate that rating is required (1-5 stars)
    if (!rating || rating < 1 || rating > 5) {
      return toast.error("Please select a rating (1-5 stars)");
    }

    setLoading(true);
    setPaymentReleaseStatus(null);
    setPaymentError(null);

    try {
      // STEP 3: If coming from "I Am Satisfied" button, first mark job as satisfied
      // CRITICAL FIX: Check if payment is already completed before attempting to release
      if (
        fromSatisfaction &&
        !jobSatisfied &&
        booking.paymentStatus !== "Completed"
      ) {
        try {
          setPaymentReleaseStatus("releasing"); // STEP 3: Show releasing status
          console.log(
            `[ReviewModal] Releasing payment for booking: ${booking._id}`,
          );

          const paymentRes = await api.put(
            `/bookings/${booking._id}/satisfied`,
          );

          console.log(
            `[ReviewModal] Payment released successfully:`,
            paymentRes.data,
          );
          setJobSatisfied(true);
          setPaymentReleaseStatus("success"); // STEP 3: Show success status

          // STEP 3: Show detailed success message with actual amount
          const amount =
            paymentRes.data?.contractorReceived ||
            paymentRes.data?.contractorAmount ||
            "N/A";
          toast.success(
            `✅ Payment released to contractor!\nAmount: Rs. ${amount}`,
          );

          // Brief delay to show success state
          await new Promise((resolve) => setTimeout(resolve, 800));
        } catch (error) {
          // STEP 3: Enhanced error handling - show backend message
          const errorMsg =
            error.response?.data?.message ||
            error.response?.data?.details ||
            "Failed to release payment";

          console.error(
            `[ReviewModal] Payment release failed:`,
            error.response?.data,
          );
          setPaymentReleaseStatus("error");
          setPaymentError(errorMsg);

          toast.error(`❌ ${errorMsg}`);
          setLoading(false);
          return;
        }
      }

      // STEP 3: Submit the review with rating (required) and comment (optional)
      await api.post("/reviews", {
        bookingId: booking._id,
        rating,
        comment, // Optional - user can leave empty
      });

      toast.success("⭐ Review submitted! Thank you.");
      onSuccess(); // Refresh parent data
      onClose(); // Close modal
    } catch (error) {
      // STEP 3: Meaningful error messages
      const errorMsg =
        error.response?.data?.message || "Failed to submit review";
      toast.error(`Review Error: ${errorMsg}`);
    } finally {
      setLoading(false);
      setPaymentReleaseStatus(null); // Clear status after processing
    }
  };

  const modalContent = (
    // High z-index to sit above everything
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex justify-center items-center p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* Manually styled box to ensure visibility */}
      <div
        className="bg-base-100 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-base-200 relative animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label="Rate Experience"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* STEP 3: Show payment already sent status */}
          {fromSatisfaction && booking.paymentStatus === "Completed" && (
            <div className="mb-4 p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2 text-success">
              <CheckCircle size={18} />
              <span className="text-sm font-bold">
                ✅ Payment already sent to contractor. Please leave your review
                below.
              </span>
            </div>
          )}

          {/* STEP 3: Show payment release status with detailed feedback */}
          {paymentReleaseStatus === "releasing" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-blue-700">
              <Loader size={18} className="animate-spin" />
              <span className="text-sm font-bold">
                Releasing payment to contractor...
              </span>
            </div>
          )}

          {paymentReleaseStatus === "success" && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle size={18} />
              <span className="text-sm font-bold">
                ✅ Payment released! Now rate the work.
              </span>
            </div>
          )}

          {paymentReleaseStatus === "error" && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold">Payment Release Failed</p>
                <p className="text-xs mt-1">{paymentError}</p>
              </div>
            </div>
          )}

          <h3 className="text-2xl font-bold text-center mb-2">
            Rate Experience
          </h3>
          <p className="text-center opacity-70 mb-6">
            How was the service provided by{" "}
            <span className="font-bold text-primary">
              {booking.contractor?.fullName}
            </span>
            ?
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* STEP 3: Star Rating - REQUIRED (show which stars are selected) */}
            <div className="flex flex-col items-center gap-2">
              <div className="rating rating-lg gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <input
                    key={star}
                    type="radio"
                    name="rating"
                    className="mask mask-star-2 bg-orange-400 scale-110 cursor-pointer"
                    checked={rating === star}
                    onChange={() => setRating(star)}
                    title={`${star} star${star > 1 ? "s" : ""}`}
                    disabled={loading}
                  />
                ))}
              </div>
              {rating > 0 && (
                <span className="text-sm font-bold text-orange-600">
                  {rating === 5 && "Excellent! 😊"}
                  {rating === 4 && "Very Good! 👍"}
                  {rating === 3 && "Good 👌"}
                  {rating === 2 && "Fair 😐"}
                  {rating === 1 && "Poor 😞"}
                </span>
              )}
              {!rating && (
                <span className="text-xs text-error font-bold">
                  * Rating required
                </span>
              )}
            </div>

            {/* STEP 3: Comment Box - OPTIONAL (not required) */}
            <div className="form-control">
              <label className="label font-bold">
                Comments <span className="text-xs opacity-50">(optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24 text-base"
                placeholder="Share details about their work (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={loading}
              ></textarea>
            </div>

            {/* STEP 3: Actions */}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                className="btn flex-1"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading || !rating}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Star size={16} /> Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReviewModal;
