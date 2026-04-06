import { useState, useEffect, useRef, useContext } from "react";
import {
  Calendar,
  Clock,
  DollarSign,
  MessageCircle,
  Send,
  ImageIcon,
  X,
  MapPin,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

const HeavyDutyBookingModal = ({ contractor, defaultJob }) => {
  const { user } = useContext(AuthContext);
  const isOtherOption = defaultJob === "Other (Custom Project";
  const [activeTab, setActiveTab] = useState("booking"); // "booking" or "chat"
  const [formData, setFormData] = useState({
    job: isOtherOption ? "Other (Custom Project)" : defaultJob || "",
    customJob: "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "17:00",
    totalBudget: "",
    description: "",
    phone: "",
    address: "",
    area: "",
  });

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [chatValidationError, setChatValidationError] = useState("");
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const heavyDutyJobs = [
    "Excavation & Earthmoving",
    "Piling & Foundation Work",
    "Steel Structure Erection",
    "Concrete Pouring & Slab Work",
    "Road & Pavement Construction",
    "Industrial Shed Construction",
    "Demolition & Debris Removal",
    "Cranes & Heavy Machinery Operations",
    "Building Foundation & Basement",
    "Boundary Wall Construction",
    "Water Tank & Overhead Tank Construction",
    "Bridge & Flyover Construction",
    "Tunnel Construction",
    "Dam & Water Reservoir Work",
    "Canal & Drainage System",
    "Sewerage & Underground Piping",
    "High-Rise Building Structure",
    "Factory & Warehouse Construction",
    "Cold Storage Construction",
    "Tower & Chimney Construction",
    "Retaining Wall Construction",
    "Land Leveling & Grading",
    "Soil Testing & Compaction",
    "RCC Work (Reinforced Concrete)",
    "Pre-Cast Construction",
    "Steel Fixing & Bar Bending",
    "Scaffolding & Formwork",
    "Bore Piling & Sheet Piling",
    "Dewatering Works",
    "Site Development & Land Clearing",
    "Railway Track Construction",
    "Airport Runway Construction",
    "Power Plant Construction",
    "Shopping Mall Structure",
    "Hospital Building Construction",
    "Educational Building Construction",
    "Other (Custom Project)",
  ];

  // Calculate payment schedule when dates or budget changes
  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.totalBudget) {
      calculatePaymentSchedule();
    }
  }, [formData.startDate, formData.endDate, formData.totalBudget]);

  // Auto-fill phone, address, area from user profile
  useEffect(() => {
    if (user) {
      console.log("Auto-filling user data:", {
        phone: user.phone,
        address: user.address,
        location: user.location,
      });
      setFormData((prev) => ({
        ...prev,
        phone: user.phone || "",
        address: user.address || "",
        area: user.location || "",
      }));
    }
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start conversation when switching to chat tab
  useEffect(() => {
    if (activeTab === "chat" && contractor && !conversationId) {
      startConversation();
    }
  }, [activeTab, contractor]);

  const startConversation = async () => {
    if (!contractor) {
      console.error("Contractor is undefined");
      toast.error("Contractor information not available");
      return;
    }

    if (!contractor._id) {
      console.error("Contractor ID is missing:", contractor);
      toast.error("Contractor ID not found");
      return;
    }

    try {
      const { data } = await api.post("/messages/start", {
        contractorId: contractor._id,
        projectType: formData.job || "Heavy Duty Construction",
      });

      setConversationId(data._id);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error(
        error.response?.data?.message || "Failed to start conversation",
      );
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const calculatePaymentSchedule = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    // Calculate inclusive calendar days (both start and end day count as work days)
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) {
      setPaymentSchedule([]);
      return;
    }

    const budget = parseFloat(formData.totalBudget);
    if (isNaN(budget) || budget <= 0) {
      setPaymentSchedule([]);
      return;
    }

    // Calculate number of milestones
    // Even days: divide by 2 (e.g., 4 days = 2 milestones of 2 days each)
    // Odd days: Math.ceil (e.g., 3 days = 2 milestones: 2 days + 1 day)
    const numberOfPayments = Math.ceil(totalDays / 2);

    const schedule = [];
    let daysCoveredSoFar = 0;

    for (let i = 0; i < numberOfPayments; i++) {
      const isLastPayment = i === numberOfPayments - 1;

      // Calculate days for this milestone
      let daysForThisMilestone;
      if (isLastPayment) {
        // Last milestone gets remaining days
        daysForThisMilestone = totalDays - daysCoveredSoFar;
      } else {
        // Regular milestone = 2 days
        daysForThisMilestone = 2;
      }

      // Calculate payment based on proportion of days
      const paymentAmount = Math.round(
        (daysForThisMilestone / totalDays) * budget,
      );

      const startDay = daysCoveredSoFar + 1;
      daysCoveredSoFar += daysForThisMilestone;
      const endDay = daysCoveredSoFar;

      const paymentDate = new Date(start);
      paymentDate.setDate(start.getDate() + daysCoveredSoFar - 1);

      schedule.push({
        paymentNumber: i + 1,
        date: paymentDate.toLocaleDateString(),
        amount: paymentAmount,
        daysCompleted: daysCoveredSoFar,
        startDay: startDay,
        endDay: endDay,
      });
    }

    // Adjust last payment to account for rounding errors
    if (schedule.length > 0) {
      const totalAllocated = schedule.reduce((sum, s) => sum + s.amount, 0);
      schedule[schedule.length - 1].amount += budget - totalAllocated;
    }

    setPaymentSchedule(schedule);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !conversationId) return;

    // Validation: Check for 8+ consecutive digits
    if (/\d{8,}/.test(newMessage)) {
      setChatValidationError(
        "🚫 Cannot share phone numbers! Please use BuildLink's chat for all communications.",
      );
      return;
    }

    // Validation: Check for restricted keywords
    const restrictedKeywords = [
      "call",
      "sms",
      "phone",
      "number",
      "whatsapp",
      "message",
      "contact",
      "mobile",
      "cell",
    ];
    const lowerMsg = newMessage.toLowerCase();
    const foundWord = restrictedKeywords.find((kw) => lowerMsg.includes(kw));
    if (foundWord) {
      setChatValidationError(
        `🚫 The word "${foundWord}" is not allowed. Sharing contact info is restricted. Use BuildLink chat only.`,
      );
      return;
    }

    setChatValidationError("");
    setSendingMessage(true);
    try {
      const payload = {
        text: newMessage.trim(),
      };

      // Convert image to base64 if selected
      if (selectedImage) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onloadend = async () => {
          payload.image = reader.result;
          await sendMessageToAPI(payload);
        };
      } else {
        await sendMessageToAPI(payload);
      }
    } catch (error) {
      console.error("Send message error:", error);
      setChatValidationError(
        error.response?.data?.message || "Failed to send message",
      );
      setSendingMessage(false);
    }
  };

  const sendMessageToAPI = async (payload) => {
    try {
      const { data } = await api.post(
        `/messages/${conversationId}/send`,
        payload,
      );

      setMessages(data.conversation?.messages || []);
      setNewMessage("");
      removeImage();
      toast.success("Message sent!");
    } catch (error) {
      throw error;
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!contractor) {
      toast.error("No contractor selected");
      return;
    }

    // For "Other" option, customJob is the job title
    if (isOtherOption) {
      if (!formData.customJob.trim()) {
        toast.error("Please enter your job title");
        return;
      }
      const wordCount = formData.customJob.trim().split(/\s+/).length;
      if (wordCount > 20) {
        toast.error("Job title must be under 20 words");
        return;
      }
    } else if (!formData.job) {
      toast.error("Please select a construction type");
      return;
    }

    if (
      !formData.startDate ||
      !formData.endDate ||
      !formData.totalBudget ||
      !formData.description?.trim()
    ) {
      toast.error(
        "Please fill all required fields including project description",
      );
      return;
    }

    // Validate custom job input when "Other" is selected from dropdown
    if (
      formData.job === "Other (Custom Project)" &&
      !formData.customJob.trim()
    ) {
      toast.error("Please enter your job title");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);

    try {
      // Use custom job title if "Other" is selected (from page or dropdown)
      const jobTitle =
        isOtherOption || formData.job === "Other (Custom Project)"
          ? formData.customJob
          : formData.job;

      const bookingData = {
        contractorId: contractor._id,
        job: jobTitle,
        startDateTime: `${formData.startDate} ${formData.startTime}`,
        endDateTime: `${formData.endDate} ${formData.endTime}`,
        budget: parseFloat(formData.totalBudget),
        paymentSchedule: paymentSchedule,
        description: formData.description,
        negotiationMessages: messages,
        conversationId: conversationId, // Link conversation to booking
        bookingType: "heavy-duty-construction",
        isCustomJob: isOtherOption || formData.job === "Other (Custom Project)",
        clientPhone: formData.phone,
        clientAddress: formData.address,
        clientArea: formData.area,
      };

      await api.post("/bookings", bookingData);
      toast.success("Heavy Duty Booking Request Sent Successfully!");
      document.getElementById("heavy_duty_booking_modal").close();

      // Reset form
      setFormData({
        job: isOtherOption ? "Other (Custom Project)" : defaultJob || "",
        customJob: "",
        startDate: "",
        startTime: "09:00",
        endDate: "",
        endTime: "17:00",
        totalBudget: "",
        description: "",
        phone: user?.phone || "",
        address: user?.address || "",
        area: user?.location || "",
      });
      setMessages([]);
      setPaymentSchedule([]);
      setConversationId(null);
    } catch (error) {
      console.error("Booking Error:", error);
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const totalDays =
    formData.startDate && formData.endDate
      ? Math.round(
          (new Date(formData.endDate) - new Date(formData.startDate)) /
            (1000 * 60 * 60 * 24),
        ) + 1
      : 0;

  return (
    <dialog id="heavy_duty_booking_modal" className="modal">
      <div className="modal-box max-w-4xl">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>

        <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
          <Calendar className="text-primary" />
          Heavy Duty Construction Booking
        </h3>

        {/* Tab Navigation */}
        <div className="tabs tabs-boxed mb-2 bg-base-200/70 p-1 rounded-box">
          <a
            className={`tab tab-lg ${activeTab === "chat" ? "tab-active tab-success text-success-content" : "text-success"}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageCircle size={18} className="mr-2" />
            Chat with Contractor
            <span className="badge badge-sm badge-success ml-2">
              Recommended
            </span>
            {messages?.length > 0 && (
              <span className="badge badge-sm badge-primary ml-2">
                {messages?.length || 0}
              </span>
            )}
          </a>
          <a
            className={`tab tab-lg ${activeTab === "booking" ? "tab-active tab-primary text-primary-content" : "text-primary"}`}
            onClick={() => setActiveTab("booking")}
          >
            <Calendar size={18} className="mr-2" />
            Booking Form
          </a>
        </div>
        <p className="text-xs mb-6 bg-success/10 border border-success/20 text-success/90 rounded-lg px-3 py-2">
          Tip: Start with chat to finalize time and budget, then submit the
          booking for contractor acceptance. You can also book first if you
          prefer, but the contractor may decline your offer and the booking
          could be wasted.
        </p>

        {contractor && (
          <div className="bg-base-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-12 h-12 rounded-full ring ring-primary ring-offset-2">
                  {contractor.profilePicture ? (
                    <img
                      src={contractor.profilePicture}
                      alt={contractor.fullName}
                    />
                  ) : (
                    <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                      <span className="text-xl font-bold">
                        {contractor.fullName[0]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-lg">{contractor.fullName}</h4>
                <p className="text-sm opacity-70">{contractor.skill}</p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Form Tab */}
        {activeTab === "booking" && (
          <form onSubmit={handleSubmitBooking}>
            {/* Job Selection */}
            {isOtherOption ? (
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold">
                    Enter Your Job Title *
                  </span>
                </label>
                <input
                  type="text"
                  name="customJob"
                  value={formData.customJob}
                  onChange={(e) => {
                    const words = e.target.value.trim().split(/\s+/);
                    if (
                      words.length <= 20 ||
                      e.target.value.length < formData.customJob.length
                    ) {
                      setFormData({ ...formData, customJob: e.target.value });
                    }
                  }}
                  placeholder="E.g., Three story commercial building with basement parking"
                  className="input input-bordered w-full"
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-info">
                    💡 Write a short job title so the contractor knows what work
                    you need (max 20 words)
                  </span>
                  <span
                    className={`label-text-alt ${formData.customJob.trim().split(/\s+/).filter(Boolean).length >= 18 ? "text-warning" : ""}`}
                  >
                    {formData.customJob.trim()
                      ? formData.customJob.trim().split(/\s+/).length
                      : 0}
                    /20 words
                  </span>
                </label>
              </div>
            ) : (
              <>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Select Construction Type *
                    </span>
                  </label>
                  <select
                    name="job"
                    value={formData.job}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="">Choose a service...</option>
                    {heavyDutyJobs.map((job) => (
                      <option key={job} value={job}>
                        {job}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Job Input - Shows when "Other" is selected from dropdown */}
                {formData.job === "Other (Custom Project)" && (
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Enter Your Job Title *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="customJob"
                      value={formData.customJob}
                      onChange={(e) => {
                        const words = e.target.value.trim().split(/\s+/);
                        if (
                          words.length <= 20 ||
                          e.target.value.length < formData.customJob.length
                        ) {
                          setFormData({
                            ...formData,
                            customJob: e.target.value,
                          });
                        }
                      }}
                      placeholder="E.g., Three story commercial building with basement parking"
                      className="input input-bordered w-full"
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-info">
                        💡 Write a short job title so the contractor knows what
                        work you need (max 20 words)
                      </span>
                      <span
                        className={`label-text-alt ${formData.customJob.trim().split(/\s+/).filter(Boolean).length >= 18 ? "text-warning" : ""}`}
                      >
                        {formData.customJob.trim()
                          ? formData.customJob.trim().split(/\s+/).length
                          : 0}
                        /20 words
                      </span>
                    </label>
                  </div>
                )}
              </>
            )}

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Start Date & Time */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Start Date *</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={(() => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  })()}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Start Time *</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  required
                />
              </div>

              {/* End Date & Time */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">End Date *</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={
                    formData.startDate ||
                    (() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    })()
                  }
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">End Time *</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  required
                />
              </div>
            </div>

            {/* Duration Display */}
            {totalDays > 0 && (
              <div className="alert alert-info mb-4">
                <Clock />
                <span>
                  <strong>Project Duration:</strong> {totalDays} day
                  {totalDays > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Total Budget */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Total Budget (PKR) *
                </span>
              </label>
              <div className="relative">
                <DollarSign
                  className="absolute left-3 top-3.5 text-gray-400"
                  size={20}
                />
                <input
                  type="number"
                  name="totalBudget"
                  value={formData.totalBudget}
                  onChange={handleInputChange}
                  placeholder="Enter total project budget"
                  className="input input-bordered w-full pl-10"
                  min="1000"
                  required
                />
              </div>
            </div>

            {/* Payment Schedule Display */}
            {paymentSchedule.length > 0 && (
              <div className="bg-base-200 rounded-lg p-4 mb-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <DollarSign className="text-success" />
                  Payment Schedule (Every 2 Days)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {paymentSchedule.map((payment, index) => {
                    // Calculate startDay and endDay if not present (for backwards compatibility)
                    let startDay = payment.startDay;
                    let endDay = payment.endDay;

                    if (!startDay || !endDay) {
                      // Fallback calculation using cumulative daysCompleted
                      if (index === 0) {
                        startDay = 1;
                        endDay = payment.daysCompleted || 2;
                      } else {
                        const prevPayment = paymentSchedule[index - 1];
                        const prevDaysCompleted =
                          prevPayment.daysCompleted || 0;
                        startDay = prevDaysCompleted + 1;
                        endDay = payment.daysCompleted || prevDaysCompleted + 2;
                      }
                    }

                    // Safety check - ensure we have valid numbers
                    startDay = startDay || 1;
                    endDay = endDay || startDay;

                    return (
                      <div
                        key={payment.paymentNumber}
                        className="flex justify-between items-center bg-base-100 p-3 rounded-lg"
                      >
                        <div>
                          <span className="font-semibold">
                            Payment #{payment.paymentNumber}
                          </span>
                          <p className="text-sm opacity-70">
                            {startDay === endDay
                              ? `Day ${startDay}`
                              : `Days ${startDay} & ${endDay}`}
                          </p>
                          <p className="text-xs opacity-60">
                            Due: {payment.date}
                          </p>
                        </div>
                        <div className="badge badge-success badge-lg">
                          Rs. {payment.amount.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="divider"></div>
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Budget:</span>
                  <span className="text-primary">
                    Rs. {parseFloat(formData.totalBudget).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Project Description - REQUIRED */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">
                  Project Description *
                </span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your construction project requirements in detail..."
                className="textarea textarea-bordered w-full h-24 resize-none"
                required
              ></textarea>
              <label className="label">
                <span className="label-text-alt text-warning">
                  ⚠️ This field is required - Provide detailed information about
                  your project
                </span>
              </label>
            </div>

            {/* Contact Information (Auto-filled from profile) */}
            <div className="bg-base-200 rounded-lg p-4 mb-4">
              <h4 className="font-bold mb-3 flex items-center gap-2 text-primary">
                <Phone className="text-primary" size={18} />
                Contact Information
              </h4>
              <p className="text-xs opacity-70 mb-3">
                📱 This information is auto-filled from your profile but you can
                edit it. It will be shared with the contractor only after
                payment is approved by admin
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Phone Number *
                    </span>
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-3.5 text-gray-400"
                      size={16}
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="03XX-XXXXXXX"
                      className="input input-bordered w-full pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Area/Location */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Area/Location *
                    </span>
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-3.5 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      placeholder="E.g., Gulberg, DHA"
                      className="input input-bordered w-full pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Complete Address *
                    </span>
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-3.5 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="House/Plot #, Street, Area, City"
                      className="input input-bordered w-full pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Link Button - Enhanced */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-info/20 via-primary/20 to-secondary/20 border-2 border-primary/30 p-5 mb-4 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-full group-hover:animate-pulse">
                  <MessageCircle className="text-primary" size={28} />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-lg block mb-1">
                    💬 Need to discuss with the contractor?
                  </span>
                  <p className="text-sm opacity-80">
                    Chat to negotiate budget, timeline, and project requirements
                    before booking
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="btn btn-primary gap-2 shadow-lg hover:scale-105 transition-transform animate-pulse hover:animate-none"
                >
                  <MessageCircle size={18} />
                  Open Chat
                </button>
              </div>
              {messages?.length > 0 && (
                <div className="absolute top-2 right-2">
                  <span className="badge badge-success gap-1 animate-bounce">
                    <MessageCircle size={10} />
                    {messages?.length || 0}
                  </span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="modal-action">
              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading || !contractor}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Processing...
                  </>
                ) : (
                  "Submit Booking Request"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Chat with Contractor Tab */}
        {activeTab === "chat" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-primary via-secondary to-accent text-white rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xl flex items-center gap-2">
                    <MessageCircle className="animate-pulse" />
                    Chat with {contractor ? contractor.fullName : "Contractor"}
                  </h4>
                  <p className="text-sm opacity-90 mt-1">
                    💬 Discuss your project requirements, budget, timeline, and
                    materials
                  </p>
                </div>
                <div className="badge badge-success gap-1 animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  Online
                </div>
              </div>
            </div>

            {/* Messages Display */}
            <div className="bg-gradient-to-b from-base-200 via-base-100 to-base-200 rounded-xl p-6 h-[450px] overflow-y-auto shadow-inner border-2 border-base-300">
              {!messages || messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-32 animate-in fade-in zoom-in duration-500">
                  <div className="bg-base-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <MessageCircle size={48} className="opacity-50" />
                  </div>
                  <p className="font-bold text-lg mb-1">No messages yet</p>
                  <p className="text-sm opacity-70">
                    Start a conversation to negotiate terms...
                  </p>
                  <p className="text-xs mt-2 opacity-50">
                    💡 Ask about budget, materials, or timeline
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(messages || []).map((msg, index) => (
                    <div
                      key={index}
                      className={`chat ${msg.sender === "customer" ? "chat-end" : "chat-start"} animate-in slide-in-from-${msg.sender === "customer" ? "right" : "left"} duration-300`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="chat-image avatar">
                        <div className="w-10 rounded-full bg-base-300 flex items-center justify-center font-bold">
                          {msg.sender === "customer" ? "👤" : "👷"}
                        </div>
                      </div>
                      <div className="chat-header text-xs font-semibold opacity-70 mb-1 flex items-center gap-1">
                        {msg.sender === "customer"
                          ? "You"
                          : contractor?.fullName}
                        <span className="opacity-50">•</span>
                        <span className="opacity-50">
                          {new Date(msg.timestamp).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                      <div
                        className={`chat-bubble ${
                          msg.sender === "customer"
                            ? "chat-bubble-primary shadow-lg shadow-primary/30"
                            : "chat-bubble-secondary shadow-lg shadow-secondary/30"
                        } text-sm leading-relaxed transition-all hover:scale-105 hover:shadow-xl`}
                      >
                        {msg.text}
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="Attachment"
                            className="mt-2 rounded-lg max-w-xs cursor-pointer hover:opacity-90"
                            onClick={() => window.open(msg.image, "_blank")}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-gradient-to-r from-base-200 to-base-300 rounded-xl p-5 shadow-lg border-2 border-primary/20">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-24 rounded-lg border-2 border-primary"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="btn btn-circle btn-xs btn-error absolute -top-2 -right-2"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-square btn-outline btn-primary"
                  title="Attach image"
                >
                  <ImageIcon size={20} />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewMessage(value);

                      // Real-time validation
                      const restricted = [
                        "call",
                        "sms",
                        "phone",
                        "number",
                        "whatsapp",
                        "message",
                        "contact",
                        "mobile",
                        "cell",
                      ];
                      const lower = value.toLowerCase();
                      const found = restricted.find((w) => lower.includes(w));

                      if (/\d{8,}/.test(value)) {
                        setChatValidationError(
                          "⚠️ Phone numbers are not allowed in chat!",
                        );
                      } else if (found) {
                        setChatValidationError(
                          `⚠️ The word "${found}" is not allowed. Sharing contact info is restricted.`,
                        );
                      } else {
                        setChatValidationError("");
                      }
                    }}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !sendingMessage &&
                      handleSendMessage()
                    }
                    placeholder="Type your message here..."
                    className={`input input-bordered w-full pr-10 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                      chatValidationError ? "border-error border-2" : ""
                    }`}
                    autoFocus
                    disabled={sendingMessage}
                  />
                  <span className="absolute right-3 top-3.5 text-xs opacity-50">
                    {newMessage.length}/500
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className={`btn btn-primary gap-2 min-w-[100px] transition-all ${
                    newMessage.trim() || selectedImage ? "animate-pulse" : ""
                  }`}
                  disabled={
                    (!newMessage.trim() && !selectedImage) || sendingMessage
                  }
                >
                  {sendingMessage ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <Send
                        size={20}
                        className={
                          newMessage.trim() || selectedImage
                            ? "animate-bounce"
                            : ""
                        }
                      />
                      Send
                    </>
                  )}
                </button>
              </div>
              {chatValidationError && (
                <p className="text-error text-sm font-semibold mt-2 animate-pulse">
                  {chatValidationError}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs">
                <div className="flex items-center gap-1 text-info">
                  <span>💡</span>
                  <span>
                    Press <kbd className="kbd kbd-xs">Enter</kbd> to send
                  </span>
                </div>
                <span className="opacity-30">•</span>
                <span className="opacity-70">
                  No phone numbers or contact info allowed
                </span>
              </div>
            </div>

            {/* Back to Booking Button */}
            <div className="flex justify-between items-center pt-4 border-t-2 border-base-300">
              <button
                type="button"
                onClick={() => setActiveTab("booking")}
                className="btn btn-ghost gap-2 hover:bg-base-200"
              >
                ← Back to Booking Form
              </button>
              {messages?.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="badge badge-success gap-1 animate-pulse">
                    <MessageCircle size={12} />
                    {messages?.length || 0} message
                    {(messages?.length || 0) > 1 ? "s" : ""}
                  </span>
                  <span className="text-xs opacity-60">
                    Messages will be sent with booking
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
};

export default HeavyDutyBookingModal;
