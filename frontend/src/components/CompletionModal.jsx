import { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Upload, X, CheckCircle } from "lucide-react";

const CompletionModal = ({ booking, onClose, onSuccess }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

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
      toast.success("Job Marked Completed!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex justify-center items-center p-4">
      <div className="bg-base-100 w-full max-w-lg rounded-xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost"
        >
          <X size={20} />
        </button>

        <h3 className="text-2xl font-bold mb-2">Job Completion Proof</h3>
        <p className="text-sm opacity-70 mb-6">
          Upload 2 photos of the finished work to receive payment.
        </p>

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
              <CheckCircle size={18} /> Submit & Finish Job
            </>
          )}
        </button>
      </div>
    </div>
  );
};
export default CompletionModal;
