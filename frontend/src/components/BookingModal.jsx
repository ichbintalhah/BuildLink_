import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  Wrench,
  AlertTriangle,
  Timer,
  Upload,
  X,
} from "lucide-react";

const BookingModal = ({
  contractor,
  defaultJob,
  fixedPrice,
  isCustomJob = false,
}) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [basePrice, setBasePrice] = useState(
    fixedPrice ? parseInt(fixedPrice) : 1000,
  );

  // Image upload state for custom jobs
  const [problemImages, setProblemImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Time States
  const [date, setDate] = useState("");
  const [booking_start_time, setBookingStartTime] = useState("");
  const [booking_end_time, setBookingEndTime] = useState("");

  const [formData, setFormData] = useState({
    serviceName: "",
    isEmergency: false,
  });

  // Calculate minimum start time based on emergency status and selected date
  const getMinStartTime = () => {
    const now = new Date();
    const selectedDate = date ? new Date(date + "T00:00:00") : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If no date selected or selected date is not today, no time restriction
    if (!selectedDate || selectedDate.getTime() !== today.getTime()) {
      return "00:00";
    }

    // For today's date
    if (formData.isEmergency) {
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } else {
      const nextHour = now.getHours() + 1;
      // If it's late at night (11 PM or later), don't allow booking for today
      // Return "00:00" to allow the date input to handle validation
      if (nextHour >= 24) {
        return "00:00";
      }
      return `${String(nextHour).padStart(2, "0")}:00`;
    }
  };

  const minStartTime = getMinStartTime();

  // Calculate Total Duration in hours
  const calculateDuration = () => {
    if (!booking_start_time || !booking_end_time) return 0;
    const [startHours, startMins] = booking_start_time.split(":").map(Number);
    const [endHours, endMins] = booking_end_time.split(":").map(Number);

    const startTotalMins = startHours * 60 + startMins;
    const endTotalMins = endHours * 60 + endMins;

    let durationMins = endTotalMins - startTotalMins;
    if (durationMins < 0) durationMins += 24 * 60; // Handle overnight

    return durationMins / 60; // Convert to hours
  };

  const totalDuration = calculateDuration();
  const totalDurationHours = Math.ceil(totalDuration);

  // Set today's date as default (or tomorrow if it's too late)
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();

    // Helper to format a Date as YYYY-MM-DD in local timezone
    const toLocalDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // If it's 11 PM or later, default to tomorrow for non-emergency bookings
    if (!formData.isEmergency && currentHour >= 23) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(toLocalDateStr(tomorrow));
    } else {
      setDate(toLocalDateStr(now));
    }
  }, [formData.isEmergency]);

  // Clear start time when emergency status changes
  useEffect(() => {
    if (booking_start_time) {
      const currentMin = minStartTime;
      if (booking_start_time < currentMin) {
        setBookingStartTime("");
        toast(
          !formData.isEmergency ? "Thank You!" : "You can now book immediately",
        );
      }
    }
  }, [formData.isEmergency]);

  // Pre-fill form
  useEffect(() => {
    if (defaultJob && !isCustomJob) {
      setFormData((prev) => ({ ...prev, serviceName: defaultJob }));
    } else if (isCustomJob) {
      setFormData((prev) => ({ ...prev, serviceName: "" }));
    }
  }, [defaultJob, isCustomJob]);

  // --- PRICE CALCULATION ---

  let price = basePrice * totalDurationHours;

  if (formData.isEmergency) {
    price = price * 1.5;
  }

  const finalPrice = Math.round(price);

  // Handle image upload for custom jobs
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (problemImages.length + files.length > 5) {
      toast.error("You can upload maximum 5 images");
      return;
    }

    files.forEach((file) => {
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 3MB`);
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload image files only");
        return;
      }

      setProblemImages((prev) => [...prev, file]);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setProblemImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to book");
    if (!booking_start_time) return toast.error("Please select a start time");
    if (!booking_end_time) return toast.error("Please select an end time");
    if (totalDuration <= 0)
      return toast.error("End time must be after start time");

    // Validate custom job requirements
    if (isCustomJob) {
      if (!formData.serviceName || formData.serviceName.trim().length === 0) {
        return toast.error("Please describe your issue");
      }
      const wordCount = formData.serviceName.trim().split(/\s+/).length;
      if (wordCount > 30) {
        return toast.error("Job description must be 30 words or less");
      }
      if (problemImages.length < 2) {
        return toast.error("Please upload at least 2 images of the problem");
      }
    }

    const now = new Date();
    const selectedDate = date ? new Date(date + "T00:00:00") : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate && selectedDate.getTime() === today.getTime()) {
      const [startHours, startMins] = booking_start_time.split(":").map(Number);
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();

      if (!formData.isEmergency) {
        const nextHour = currentHours + 1;
        if (startHours < nextHour) {
          return toast.error(
            `Normal bookings must start from ${String(nextHour).padStart(
              2,
              "0",
            )}:00 or later. Check 'Emergency' for immediate booking.`,
          );
        }
      } else {
        const selectedTimeInMins = startHours * 60 + startMins;
        const currentTimeInMins = currentHours * 60 + currentMins;
        if (selectedTimeInMins < currentTimeInMins) {
          return toast.error("Start time cannot be in the past");
        }
      }
    }

    setLoading(true);

    try {
      // Use FormData if custom job with images
      if (isCustomJob && problemImages.length > 0) {
        const formDataWithFiles = new FormData();
        formDataWithFiles.append("contractorId", contractor._id);
        formDataWithFiles.append(
          "serviceName",
          formData.serviceName || "Custom Service",
        );
        formDataWithFiles.append("scheduledDate", date);
        formDataWithFiles.append("booking_start_time", booking_start_time);
        formDataWithFiles.append("totalDuration", totalDurationHours);
        formDataWithFiles.append("totalPrice", finalPrice);
        formDataWithFiles.append("isEmergency", formData.isEmergency);
        formDataWithFiles.append("isCustomJob", true);

        // Append images
        problemImages.forEach((image, index) => {
          formDataWithFiles.append("problemImages", image);
        });

        await api.post("/bookings", formDataWithFiles, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Regular booking without images
        const bookingPayload = {
          contractorId: contractor._id,
          serviceName: formData.serviceName || "General Service",
          scheduledDate: date,
          booking_start_time,
          totalDuration: totalDurationHours,
          totalPrice: finalPrice,
          isEmergency: formData.isEmergency,
        };
        await api.post("/bookings", bookingPayload);
      }

      toast.success("Booking Request Sent!");
      document.getElementById("booking_modal").close();

      // Reset form
      setFormData({ serviceName: "", isEmergency: false });
      setProblemImages([]);
      setImagePreviews([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog id="booking_modal" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box p-0 bg-base-100 flex flex-col max-h-[85vh]">
        {/* --- 1. FIXED HEADER --- */}
        <div className="bg-primary p-4 text-primary-content flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-12 h-12 rounded-full ring ring-white ring-offset-2">
                {contractor?.profilePicture ? (
                  <img
                    src={contractor.profilePicture}
                    alt={contractor?.fullName}
                  />
                ) : (
                  <div className="bg-white/20 w-full h-full flex items-center justify-center">
                    <span className="text-xl font-bold">
                      {contractor?.fullName?.[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg">{contractor?.fullName}</h3>
              <p className="text-xs opacity-80">
                {contractor?.contractorDetails?.skill} • {contractor?.address}
              </p>
            </div>
          </div>
          <div className="bg-white/20 p-2 rounded-lg">
            <Wrench size={20} />
          </div>
        </div>

        {/* --- 2. SCROLLABLE BODY --- */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="bookingForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Service Name */}
            <div className="form-control">
              <label className="label font-bold text-xs uppercase opacity-60">
                {isCustomJob ? "Describe Your Issue" : "Service Needed"}
              </label>
              {isCustomJob ? (
                <>
                  <textarea
                    placeholder="Describe your problem in 30 words or less..."
                    className="textarea textarea-bordered w-full h-20"
                    value={formData.serviceName}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceName: e.target.value })
                    }
                    maxLength={200}
                    required
                  />
                  <div className="label">
                    <span className="label-text-alt">
                      {
                        formData.serviceName
                          .trim()
                          .split(/\s+/)
                          .filter((w) => w).length
                      }{" "}
                      / 30 words
                    </span>
                  </div>
                </>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Fix Kitchen Sink"
                  className="input input-bordered w-full"
                  value={formData.serviceName}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceName: e.target.value })
                  }
                  required
                />
              )}
            </div>

            {/* Image Upload Section for Custom Jobs */}
            {isCustomJob && (
              <div className="form-control border-2 border-dashed border-base-300 rounded-lg p-4">
                <label className="label font-bold text-xs uppercase opacity-60">
                  <Upload size={16} className="mr-1" /> Upload Problem Images
                  (Min. 2)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Problem ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="btn btn-circle btn-xs btn-error absolute -top-2 -right-2"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                {problemImages.length < 5 && (
                  <label className="btn btn-outline btn-sm gap-2">
                    <Upload size={16} />
                    Add Images ({problemImages.length}/5)
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
                <p className="text-xs opacity-60 mt-2">
                  Upload 2-5 clear images of the problem (Max 3MB each)
                </p>
              </div>
            )}

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label font-bold text-xs uppercase opacity-60">
                  <Calendar size={14} className="mr-1" /> Date
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={date}
                  min={(() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  })()}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-control">
                <label className="label font-bold text-xs uppercase opacity-60">
                  <Clock size={14} className="mr-1" /> Start Time
                </label>
                <input
                  key={`start-time-${formData.isEmergency}`}
                  type="time"
                  className="input input-bordered w-full"
                  value={booking_start_time}
                  min={minStartTime}
                  onChange={(e) => setBookingStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* ✅ FIXED TEXT: Moved OUT of the grid so it fits perfectly */}
            {!formData.isEmergency && date && (
              <div className="bg-warning/10 text-warning p-3 rounded-lg flex items-start gap-2 text-xs">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>Normal bookings start from the next hour.</span>
              </div>
            )}

            {/* End Time Input */}
            <div className="grid grid-cols-1 gap-4">
              <div className="form-control">
                <label className="label font-bold text-xs uppercase opacity-60">
                  <Clock size={14} className="mr-1" /> End Time
                </label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={booking_end_time}
                  onChange={(e) => setBookingEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Total Duration Display */}
            {totalDuration > 0 && (
              <div className="bg-base-200 border border-base-300 rounded-lg p-4 flex items-center justify-center gap-2">
                <Timer size={20} className="text-primary" />
                <div className="text-center">
                  <p className="text-xs uppercase opacity-60">Total Duration</p>
                  <p className="font-bold text-lg text-primary">
                    {totalDurationHours} Hour
                    {totalDurationHours !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Emergency Toggle */}
            <div className="form-control bg-base-200 rounded-lg p-4">
              <label className="label cursor-pointer justify-between">
                <span className="label-text font-bold flex items-center gap-2">
                  <AlertTriangle size={16} className="text-error" /> Emergency
                  Booking
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-error"
                  checked={formData.isEmergency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isEmergency: e.target.checked,
                    })
                  }
                />
              </label>
              <p className="text-xs opacity-60 mt-2 ml-1">
                {formData.isEmergency
                  ? "✓ Additional 50% charge applied"
                  : "Enable for immediate booking with 50% surcharge"}
              </p>
            </div>

            {/* Total Price Display */}
            <div className="bg-neutral text-neutral-content rounded-lg p-4 flex justify-between items-center shadow-inner mt-4">
              <div className="text-sm opacity-80">
                <div>Rate: Rs. {basePrice}/hr</div>
                <div className="text-xs mt-1">
                  Duration: {totalDurationHours} hour
                  {totalDurationHours !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase opacity-70">Total Price</div>
                <div className="text-2xl font-bold text-primary">
                  Rs. {finalPrice.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="h-4"></div>
          </form>
        </div>

        {/* --- 3. FIXED FOOTER (BUTTONS) --- */}
        <div className="p-4 border-t border-base-200 bg-base-100 flex gap-3 shrink-0">
          <form method="dialog" className="w-1/3">
            <button className="btn btn-ghost w-full">Cancel</button>
          </form>
          <button
            type="submit"
            form="bookingForm"
            className="btn btn-primary w-2/3 shadow-lg"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Confirm & Book"
            )}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default BookingModal;
