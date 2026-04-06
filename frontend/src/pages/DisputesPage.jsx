import { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import ImagePreviewModal from "../components/ImagePreviewModal";
import {
  AlertTriangle,
  Upload,
  Shield,
  User as UserIcon,
  Wrench,
} from "lucide-react";

const DisputesPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [disputes, setDisputes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Form State - auto-select booking if passed via navigation state
  const [selectedBooking, setSelectedBooking] = useState(
    location.state?.bookingId || "",
  );
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState([]);

  // Contractor Defense State
  const [defenseText, setDefenseText] = useState("");
  const [defenseEvidence, setDefenseEvidence] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewAlt, setPreviewAlt] = useState("Dispute evidence");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [dRes, bRes] = await Promise.allSettled([
        api.get("/disputes"),
        api.get("/bookings?limit=100"),
      ]);

      // Handle disputes
      if (dRes.status === "fulfilled") {
        setDisputes(Array.isArray(dRes.value.data) ? dRes.value.data : []);
      } else {
        console.error("Disputes fetch failed:", dRes.reason);
        setDisputes([]);
      }

      // Handle bookings
      if (bRes.status === "fulfilled") {
        setBookings(
          Array.isArray(bRes.value.data)
            ? bRes.value.data
            : bRes.value.data?.bookings || [],
        );
      } else {
        console.error("Bookings fetch failed:", bRes.reason);
        setBookings([]);
      }
    } catch (e) {
      console.error("DisputesPage loadData error:", e);
      setError(e.message || "Failed to load data");
      setDisputes([]);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImage = (e, setter, currentList) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter([...currentList, reader.result]);
      reader.readAsDataURL(file);
    }
  };

  const openImagePreview = (imageUrl, altText = "Dispute evidence") => {
    if (!imageUrl) return;
    setPreviewImage(imageUrl);
    setPreviewAlt(altText);
  };

  const submitDispute = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return toast.error("Select a Job");
    try {
      // ✅ FIX 2: Ensure endpoint matches disputeRoutes ("/create")
      // Since router is mounted at /api/disputes, full path is /api/disputes/create
      await api.post("/disputes/create", {
        bookingId: selectedBooking,
        reason,
        userEvidence: evidence,
      });

      toast.success("Dispute Filed Successfully!", {
        icon: "⏳",
        duration: 5000,
      });

      setReason("");
      setEvidence([]);
      setSelectedBooking("");
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to file dispute");
    }
  };

  const submitDefense = async (id) => {
    if (!defenseText.trim()) {
      return toast.error("Please provide a defense");
    }
    try {
      await api.put(`/disputes/${id}/defense`, {
        defense: defenseText,
        evidence: defenseEvidence,
      });

      toast.success("Defense Submitted Successfully!");
      setDefenseText("");
      setDefenseEvidence([]);
      loadData();
    } catch (e) {
      toast.error("Failed to submit defense");
    }
  };

  if (isLoading) {
    return <PageLoader isLoading={true} message="Loading disputes..." />;
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 pt-6">
        <div className="alert alert-error">
          <AlertTriangle size={20} />
          <div>
            <h3 className="font-bold">Failed to load disputes</h3>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={loadData} className="btn btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-3 border-b border-base-300 pb-4">
        <Shield className="text-red-600" size={32} />
        <div>
          <h1 className="text-3xl font-bold text-base-content">
            Dispute Center
          </h1>
          <p className="text-base-content/60">
            Resolve issues fairly with official mediation.
          </p>
        </div>
      </div>

      {/* CREATE FORM (User Only) */}
      {user.role === "user" && (
        <div className="card bg-base-100 shadow-lg border-l-4 border-error">
          <div className="card-body">
            <h3 className="card-title text-error">
              <AlertTriangle /> File New Complaint
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label font-bold">Select Job</label>
                <select
                  className="select select-bordered w-full"
                  onChange={(e) => setSelectedBooking(e.target.value)}
                  value={selectedBooking}
                >
                  <option value="">-- Choose Job --</option>
                  {bookings
                    .filter((b) => ["Completed", "Active"].includes(b.status))
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.serviceName} (Rs. {b.totalPrice})
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label font-bold">Describe Issue</label>
                <input
                  type="text"
                  placeholder="e.g., Work incomplete..."
                  className="input input-bordered w-full"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="label font-bold">
                Upload Evidence (Photos)
              </label>
              <div className="flex gap-4 items-center">
                {evidence.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      openImagePreview(img, `Uploaded evidence ${i + 1}`)
                    }
                    className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Open uploaded evidence ${i + 1}`}
                  >
                    <img
                      src={img}
                      alt={`Uploaded evidence ${i + 1}`}
                      className="h-16 w-16 rounded object-cover border border-base-300 hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                  </button>
                ))}
                <label className="btn btn-outline btn-sm gap-2">
                  <Upload size={16} /> Add Photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImage(e, setEvidence, evidence)}
                  />
                </label>
              </div>
            </div>
            <button
              onClick={submitDispute}
              disabled={!selectedBooking || !reason}
              className="btn btn-error text-white mt-4 w-full font-bold"
            >
              Submit Dispute to Admin
            </button>
          </div>
        </div>
      )}

      {/* DISPUTE LIST */}
      <h2 className="text-xl font-bold text-base-content/80">
        Active Disputes
      </h2>
      {disputes.length === 0 && (
        <p className="opacity-50">No active disputes.</p>
      )}

      <div className="grid gap-6">
        {disputes.map((d) => (
          <div
            key={d._id}
            className="card bg-base-100 shadow-md border border-base-200"
          >
            <div className="card-body p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">
                    {d.booking?.serviceName || "Service Name Unavailable"}
                  </h3>
                  <p className="text-xs opacity-50">ID: {d._id}</p>
                  {/* Show milestone info for heavy-duty disputes */}
                  {d.booking?.bookingType === "heavy-duty-construction" &&
                    d.booking?.currentMilestone !== undefined && (
                      <div className="mt-2 badge badge-warning badge-sm">
                        Milestone {(d.booking.currentMilestone || 0) + 1}{" "}
                        Disputed
                      </div>
                    )}
                </div>
                <div
                  className={`badge badge-lg ${
                    d.status === "Open"
                      ? "badge-error text-white"
                      : "badge-success text-white"
                  }`}
                >
                  {d.status}
                </div>
              </div>

              {/* CLAIM SECTION */}
              <div className="mt-4 bg-error/10 p-4 rounded-lg border border-error/20">
                <p className="font-bold text-error text-xs uppercase mb-2">
                  Homeowner Claim
                </p>
                <div className="flex items-center gap-3 mb-2">
                  {d.user?.profilePicture || d.booking?.user?.profilePicture ? (
                    <img
                      src={
                        d.user?.profilePicture ||
                        d.booking?.user?.profilePicture
                      }
                      alt="User"
                      className="h-10 w-10 rounded-full object-cover border-2 border-error/30"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-error/20 flex items-center justify-center border-2 border-error/30">
                      <UserIcon size={20} className="text-error" />
                    </div>
                  )}
                  <span className="font-semibold text-base-content">
                    {d.user?.fullName ||
                      d.booking?.user?.fullName ||
                      "Homeowner"}
                  </span>
                </div>
                <p className="text-base-content font-medium">"{d.reason}"</p>
                <div className="flex gap-2 mt-2">
                  {d.userEvidence?.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        openImagePreview(img, `Homeowner evidence ${i + 1}`)
                      }
                      className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
                      aria-label={`Open homeowner evidence ${i + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Homeowner evidence ${i + 1}`}
                        className="h-12 w-12 rounded border bg-base-100 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* DEFENSE SECTION (Contractor Only) */}
              {user.role === "contractor" &&
                d.status === "Open" &&
                !d.contractorDefense && (
                  <div className="mt-4 p-4 bg-base-200 rounded-lg border border-base-300">
                    <p className="font-bold text-primary text-xs uppercase mb-2">
                      Your Defense
                      {d.booking?.bookingType === "heavy-duty-construction" &&
                        d.booking?.currentMilestone !== undefined && (
                          <span className="ml-2 text-warning font-normal">
                            (Milestone {(d.booking.currentMilestone || 0) + 1})
                          </span>
                        )}
                    </p>
                    {d.booking?.bookingType === "heavy-duty-construction" && (
                      <div className="text-xs bg-info/20 p-2 rounded border border-info/30 mb-3">
                        ℹ️ This dispute is for Milestone{" "}
                        {(d.booking.currentMilestone || 0) + 1}. Explain your
                        work and provide evidence to defend your milestone
                        completion.
                      </div>
                    )}
                    <textarea
                      className="textarea textarea-bordered w-full bg-base-100 text-base-content"
                      placeholder="Explain your side..."
                      value={defenseText}
                      onChange={(e) => setDefenseText(e.target.value)}
                    ></textarea>

                    <div className="flex gap-4 items-center mt-2">
                      <label className="btn btn-xs btn-outline">
                        <Upload size={12} /> Add Proof{" "}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            handleImage(e, setDefenseEvidence, defenseEvidence)
                          }
                        />
                      </label>
                      {defenseEvidence.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            openImagePreview(
                              img,
                              `Defense upload evidence ${i + 1}`,
                            )
                          }
                          className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={`Open defense upload evidence ${i + 1}`}
                        >
                          <img
                            src={img}
                            alt={`Defense upload evidence ${i + 1}`}
                            className="h-8 w-8 rounded border object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                          />
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => submitDefense(d._id)}
                      className="btn btn-primary btn-sm mt-3 w-full"
                    >
                      Submit Defense
                    </button>
                  </div>
                )}

              {d.contractorDefense && (
                <div className="mt-4 bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <p className="font-bold text-primary text-xs uppercase mb-2">
                    Contractor Defense
                  </p>
                  <div className="flex items-center gap-3 mb-2">
                    {d.contractor?.profilePicture ||
                    d.booking?.contractor?.profilePicture ? (
                      <img
                        src={
                          d.contractor?.profilePicture ||
                          d.booking?.contractor?.profilePicture
                        }
                        alt="Contractor"
                        className="h-10 w-10 rounded-full object-cover border-2 border-primary/30"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                        <Wrench size={20} className="text-primary" />
                      </div>
                    )}
                    <span className="font-semibold text-base-content">
                      {d.contractor?.fullName ||
                        d.booking?.contractor?.fullName ||
                        "Professional"}
                    </span>
                  </div>
                  <p className="text-base-content font-medium">
                    "{d.contractorDefense}"
                  </p>
                  {d.contractorEvidence?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {d.contractorEvidence.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            openImagePreview(
                              img,
                              `Contractor evidence ${i + 1}`,
                            )
                          }
                          className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={`Open contractor evidence ${i + 1}`}
                        >
                          <img
                            src={img}
                            alt={`Contractor evidence ${i + 1}`}
                            className="h-12 w-12 rounded border bg-base-100 object-cover hover:opacity-90 transition-opacity cursor-zoom-in"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ImagePreviewModal
        imageUrl={previewImage}
        alt={previewAlt}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default DisputesPage;
