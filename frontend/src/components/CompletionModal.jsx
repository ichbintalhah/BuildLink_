import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Upload, X, CheckCircle } from "lucide-react";

const CompletionModal = ({ booking, onClose, onSuccess }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Check if this is a milestone-based heavy duty construction job
  const isHeavyDuty =
    booking?.bookingType === "heavy-duty-construction" &&
    booking?.paymentSchedule &&
    booking?.paymentSchedule.length > 0;

  const currentMilestoneIdx = booking?.currentMilestone || 0;
  const currentMilestone = isHeavyDuty
    ? booking.paymentSchedule[currentMilestoneIdx]
    : null;
  const isLastMilestone = isHeavyDuty
    ? currentMilestoneIdx === booking.paymentSchedule.length - 1
    : false;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 2)
      return toast.error("Max 2 images allowed");

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setImages((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async () => {
    if (images.length < 2)
      return toast.error("Please upload exactly 2 proof images.");
    setLoading(true);
    try {
      await api.put(`/bookings/${booking._id}`, {
        status: "Completed",
        completionImages: images,
      });

      if (isHeavyDuty && !isLastMilestone) {
        toast.success(
          `Milestone ${currentMilestoneIdx + 1} submitted! Waiting for client approval.`,
        );
      } else {
        toast.success("Job Marked Completed!");
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to complete job";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-base-100 w-full max-w-lg rounded-xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
        >
          <X size={20} />
        </button>

        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
          {isHeavyDuty ? "🏗️" : "✅"}{" "}
          {isHeavyDuty
            ? `Milestone ${currentMilestoneIdx + 1}/${booking.paymentSchedule.length} Completion`
            : "Job Completion Proof"}
        </h3>
        <p className="text-sm opacity-70 mb-4">
          Upload 2 photos of the finished work to receive payment.
        </p>

        {isHeavyDuty && currentMilestone && (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg border-2 border-primary/30 mb-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="opacity-60 font-semibold">Days Required</div>
                <div className="font-bold text-primary">
                  {currentMilestone.daysCompleted} days
                </div>
              </div>
              <div>
                <div className="opacity-60 font-semibold">Payment Amount</div>
                <div className="font-bold text-success">
                  Rs. {currentMilestone.amount}
                </div>
              </div>
            </div>
            {isLastMilestone && (
              <div className="mt-2 text-xs text-success font-bold">
                🎉 This is the final milestone!
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              className="h-32 w-full object-cover rounded-lg border border-base-300"
            />
          ))}
          {images.length < 2 && (
            <label className="h-32 border-2 border-dashed border-base-300 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:bg-base-200 transition">
              <Upload className="opacity-50 mb-1" />
              <span className="text-xs opacity-50">Upload Photo</span>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
            </label>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="btn btn-success w-full text-white"
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <>
              <CheckCircle size={18} />{" "}
              {isHeavyDuty && !isLastMilestone
                ? `Submit Milestone ${currentMilestoneIdx + 1}`
                : "Submit & Finish Job"}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
export default CompletionModal;
