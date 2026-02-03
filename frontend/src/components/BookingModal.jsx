import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { Calendar, Clock, Wrench, AlertTriangle, Timer } from "lucide-react";

const BookingModal = ({ contractor, defaultJob, fixedPrice }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [basePrice, setBasePrice] = useState(
    fixedPrice ? parseInt(fixedPrice) : 1000
  );

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
      if (nextHour >= 24) {
        return "23:59";
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

  // Set today's date as default
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    setDate(todayStr);
  }, []);

  // Clear start time when emergency status changes
  useEffect(() => {
    if (booking_start_time) {
      const currentMin = minStartTime;
      if (booking_start_time < currentMin) {
        setBookingStartTime("");
        toast.info(
          !formData.isEmergency
            ? "Please select a time from next hour onwards"
            : "You can now book immediately",
        );
      }
    }
  }, [formData.isEmergency]);

  // Pre-fill form
  useEffect(() => {
    if (defaultJob) {
      setFormData((prev) => ({ ...prev, serviceName: defaultJob }));
    }
  }, [defaultJob]);

  // --- PRICE CALCULATION ---
  
  let price = basePrice * totalDurationHours;

  if (formData.isEmergency) {
    price = price * 1.5;
  }

  const finalPrice = Math.round(price);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to book");
    if (!booking_start_time) return toast.error("Please select a start time");
    if (!booking_end_time) return toast.error("Please select an end time");
    if (totalDuration <= 0)
      return toast.error("End time must be after start time");

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
        if (
          startHours < nextHour ||
          (startHours === nextHour && startMins < 0)
        ) {
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

    const bookingPayload = {
      contractorId: contractor._id,
      serviceName: formData.serviceName || "General Service",
      scheduledDate: date,
      booking_start_time,
      totalDuration: totalDurationHours,
      totalPrice: finalPrice,
      isEmergency: formData.isEmergency,
    };

    try {
      await api.post("/bookings", bookingPayload);
      toast.success("Booking Request Sent!");
      document.getElementById("booking_modal").close();
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
          <div>
            <h3 className="font-bold text-lg">Book {contractor?.fullName}</h3>
            <p className="text-xs opacity-80">
              {contractor?.contractorDetails?.skill} • {contractor?.address}
            </p>
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
                Service Needed
              </label>
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
            </div>

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
                  min={new Date().toISOString().split("T")[0]}
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
                  onChange={(e) => {
                    const selectedTime = e.target.value;
                    if (selectedTime < minStartTime) {
                      toast.error(
                        !formData.isEmergency
                          ? "Normal bookings start from next hour."
                          : "Please select a valid time",
                      );
                      setBookingStartTime(minStartTime);
                    } else {
                      setBookingStartTime(selectedTime);
                    }
                  }}
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
