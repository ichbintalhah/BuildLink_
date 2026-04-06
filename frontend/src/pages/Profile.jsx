import { useState, useContext, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  User,
  MapPin,
  Briefcase,
  CreditCard,
  Save,
  Camera,
  Image as ImageIcon,
  X,
  Users,
  Plus,
  Trash2,
  ArrowLeft,
  Star,
  CheckCircle,
} from "lucide-react";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const contractorId = searchParams.get("contractor");
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [viewingContractor, setViewingContractor] = useState(null);
  const [isLoadingContractor, setIsLoadingContractor] = useState(false);
  const fileInputRef = useRef(null);
  const portfolioInputRef = useRef(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    location: "",
    skill: "",
    teamType: "",
    paymentMethod: "",
    paymentAccount: "",
    phoneForMobileWallet: "",
    ibanNumber: "",
    availability: "Green",
  });
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (contractorId) {
      setIsLoadingContractor(true);
      api
        .get(`/contractors/${contractorId}`)
        .then(({ data }) => {
          setViewingContractor(data);
          setIsLoadingContractor(false);
        })
        .catch((error) => {
          console.error("Error loading contractor profile:", error);
          toast.error("Failed to load contractor profile");
          setIsLoadingContractor(false);
        });
    }
  }, [contractorId]);

  useEffect(() => {
    if (!contractorId && user) {
      const isMobileWallet = (method) =>
        ["EasyPaisa", "JazzCash", "Sadapay", "Nayapay"].includes(method);

      const pickedSkill =
        user.contractorDetails?.skill || user.skill || "Plumber";
      const pickedPaymentMethod =
        user.contractorDetails?.paymentMethod ||
        user.paymentMethod ||
        "EasyPaisa";
      const pickedPaymentAccount =
        user.contractorDetails?.paymentAccount ||
        user.paymentAccountValue ||
        "";
      const pickedPhoneForWallet = isMobileWallet(pickedPaymentMethod)
        ? user.contractorDetails?.phoneForMobileWallet ||
          pickedPaymentAccount ||
          ""
        : user.contractorDetails?.phoneForMobileWallet || "";
      const pickedIban =
        pickedPaymentMethod === "Bank Account"
          ? user.contractorDetails?.ibanNumber || pickedPaymentAccount || ""
          : user.contractorDetails?.ibanNumber || "";

      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        location: user.location || "",
        skill: pickedSkill,
        teamType: user.contractorDetails?.teamType || "Individual",
        paymentMethod: pickedPaymentMethod,
        paymentAccount: pickedPaymentAccount,
        phoneForMobileWallet: pickedPhoneForWallet,
        ibanNumber: pickedIban,
        availability: user.contractorDetails?.availability || "Green",
      });
      if (user.contractorDetails?.teamMembers) {
        setTeamMembers(user.contractorDetails.teamMembers);
      }
    }
  }, [user, contractorId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addTeamMember = () =>
    setTeamMembers([...teamMembers, { name: "", skill: "Helper" }]);

  const removeTeamMember = (index) => {
    const updated = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(updated);
  };

  const updateTeamMember = (index, field, value) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const handleProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
      toast.success("Profile picture selected (click Save to upload)");
    }
  };

  const handlePortfolioFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPortfolioImages([...portfolioImages, ...newImages]);
  };

  const removePortfolioImage = (index) => {
    const newImages = [...portfolioImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setPortfolioImages(newImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Upload profile picture first if changed
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append("profilePicture", profilePictureFile);

        const { data: pictureData } = await api.put(
          "/users/profile-picture",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        // Update user context with new profile picture
        setUser(pictureData.user);
        toast.success("Profile picture updated!");

        // Clear the file and preview after successful upload
        setProfilePictureFile(null);
        setProfilePreview(null);
      }

      // Update other profile data
      const isMobileWallet = (method) =>
        ["EasyPaisa", "JazzCash", "Sadapay", "Nayapay"].includes(method);

      // Keep backward compatibility: store the wallet phone in both fields when applicable
      const normalizedPaymentAccount = isMobileWallet(formData.paymentMethod)
        ? formData.phoneForMobileWallet || formData.paymentAccount
        : formData.ibanNumber || formData.paymentAccount;

      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        location: formData.location,
        contractorDetails: {
          paymentMethod: formData.paymentMethod,
          paymentAccount: normalizedPaymentAccount,
          phoneForMobileWallet: isMobileWallet(formData.paymentMethod)
            ? normalizedPaymentAccount
            : formData.phoneForMobileWallet,
          ibanNumber:
            formData.paymentMethod === "Bank Account"
              ? normalizedPaymentAccount
              : formData.ibanNumber,
        },
      };
      if (user.role === "contractor") {
        payload.contractorDetails = {
          ...payload.contractorDetails,
          skill: formData.skill,
          teamType: formData.teamType,
          availability: formData.availability,
          teamMembers: formData.teamType === "Team" ? teamMembers : [],
        };
      }
      const { data } = await api.put("/users/profile", payload);
      toast.success("Profile & Settings Saved!");
      setUser(data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (contractorId && viewingContractor) {
    return (
      <div className="min-h-screen bg-base-200 py-10 px-4 font-sans">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm gap-2"
            >
              <ArrowLeft size={20} /> Back
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="card bg-base-100 shadow-xl overflow-hidden border border-base-300">
                <div className="h-32 bg-gradient-to-r from-primary to-secondary"></div>
                <div className="card-body pt-0 items-center text-center">
                  <div className="-mt-16 mb-4">
                    <div className="avatar placeholder">
                      {/* FIXED: Added 'flex items-center justify-center' */}
                      <div className="w-32 h-32 rounded-full ring ring-base-100 ring-offset-4 bg-neutral text-neutral-content shadow-2xl flex items-center justify-center overflow-hidden">
                        {viewingContractor?.profilePicture ? (
                          <img
                            src={viewingContractor.profilePicture}
                            alt={viewingContractor.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-5xl font-bold">
                            {viewingContractor?.fullName?.[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <h2 className="card-title text-2xl font-bold">
                    {viewingContractor?.fullName}
                  </h2>
                  <p className="text-sm opacity-70">
                    {viewingContractor?.email}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <div
                      className={`badge badge-lg font-bold text-white ${
                        viewingContractor?.availabilityStatus === "Available" ||
                        viewingContractor?.availability === "Green"
                          ? "badge-success"
                          : "badge-error"
                      }`}
                    >
                      {viewingContractor?.availabilityStatus === "Available" ||
                      viewingContractor?.availability === "Green"
                        ? "Available"
                        : "Busy"}
                    </div>
                    {viewingContractor?.isTrusted && (
                      <div className="badge badge-success text-white gap-1">
                        <CheckCircle size={14} /> Trusted
                      </div>
                    )}
                  </div>
                  {viewingContractor?.rating > 0 && (
                    <div className="flex items-center gap-2 mt-3 justify-center">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={
                              i < Math.round(viewingContractor?.rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-base-300"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-sm font-bold">
                        {viewingContractor?.rating.toFixed(1)}
                      </span>
                      <span className="text-xs opacity-60">
                        ({viewingContractor?.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                  {viewingContractor?.isVerified && (
                    <div className="badge badge-success text-white mt-2 gap-1">
                      <CheckCircle size={14} /> Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                    <Briefcase className="text-primary" /> Professional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label font-semibold text-base-content/70">
                        Specialty
                      </label>
                      <p className="text-lg font-bold">
                        {viewingContractor?.skill || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="label font-semibold text-base-content/70">
                        Work Setup
                      </label>
                      <p className="text-lg font-bold">
                        {viewingContractor?.teamType || "Individual"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                    <MapPin className="text-info" /> Location
                  </h3>
                  <p className="text-lg">{viewingContractor?.address}</p>
                  {viewingContractor?.location && (
                    <p className="text-sm opacity-70 mt-2">
                      📍 {viewingContractor?.location}
                    </p>
                  )}
                </div>
              </div>
              {viewingContractor?.teamMembers &&
                viewingContractor?.teamMembers.length > 0 && (
                  <div className="card bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                        <Users className="text-accent" /> Team Members
                      </h3>
                      <div className="space-y-3">
                        {viewingContractor?.teamMembers.map((member, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 p-4 bg-base-200 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-bold">{member.name}</p>
                              <p className="text-sm opacity-60">
                                {member.skill}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              <div className="card bg-gradient-to-r from-primary to-primary/80 shadow-xl border-0 text-primary-content">
                <div className="card-body">
                  <h3 className="card-title">
                    Ready to hire this professional?
                  </h3>
                  <p>
                    Contact through our booking system to schedule a service.
                  </p>
                  <div className="card-actions justify-end mt-4">
                    <a href="/contractors" className="btn btn-ghost text-white">
                      Back to Search
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (contractorId && isLoadingContractor) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/60">
            Loading contractor profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-base-content">
              Profile Settings
            </h1>
            <p className="text-base-content/60 mt-1">
              Manage your identity, payments, and account details.
            </p>
          </div>
          <button
            onClick={handleSubmit}
            className="btn btn-primary btn-lg shadow-lg gap-2"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <>
                <Save size={20} /> Save All Changes
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="card bg-base-100 shadow-xl overflow-hidden border border-base-300">
              <div className="h-32 bg-gradient-to-r from-primary to-secondary"></div>
              <div className="card-body pt-0 items-center text-center">
                <div className="-mt-16 mb-4 relative group">
                  <div
                    className="avatar placeholder cursor-pointer"
                    onClick={() => fileInputRef.current.click()}
                  >
                    {/* FIXED: Added 'flex items-center justify-center' */}
                    <div className="w-32 h-32 rounded-full ring ring-base-100 ring-offset-4 bg-neutral text-neutral-content shadow-2xl flex items-center justify-center overflow-hidden">
                      {profilePreview ? (
                        <img
                          src={profilePreview}
                          className="object-cover w-full h-full"
                        />
                      ) : user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user?.fullName}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-5xl font-bold">
                          {user?.fullName?.[0]}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white">
                      <Camera size={32} />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfileFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
                <h2 className="card-title text-2xl font-bold">
                  {user?.fullName}
                </h2>
                <p className="text-sm opacity-70">{user?.email}</p>
                <div className="flex gap-2 mt-2">
                  <div
                    className={`badge badge-lg font-bold ${
                      user?.role === "contractor"
                        ? "badge-secondary"
                        : "badge-primary"
                    }`}
                  >
                    {user?.role === "contractor"
                      ? "Pro Contractor"
                      : "Homeowner"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                  <User className="text-primary" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label font-semibold">Full Name</label>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label font-semibold">Phone</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label font-semibold">Address</label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>
                  <div className="form-control md:col-span-2">
                    <label className="label font-semibold">
                      Location (City/Area)
                    </label>
                    <input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="input input-bordered"
                      placeholder="e.g. Lahore, DHA"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                  <CreditCard className="text-success" />
                  {user?.role === "contractor"
                    ? "Receiving Payment Details"
                    : "Payment Information"}
                </h3>
                <div className="space-y-6">
                  <div className="form-control">
                    <label className="label font-semibold">
                      Payment Method
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="select select-bordered w-full"
                    >
                      <option value="">-- Select Method --</option>
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="Sadapay">Sadapay</option>
                      <option value="Nayapay">Nayapay</option>
                      <option value="Bank Account">Bank Account</option>
                    </select>
                  </div>

                  {/* Mobile Wallet Payment (EasyPaisa, JazzCash, Sadapay, Nayapay) */}
                  {["EasyPaisa", "JazzCash", "Sadapay", "Nayapay"].includes(
                    formData.paymentMethod,
                  ) && (
                    <div className="form-control bg-info/10 p-4 rounded-lg border border-info/30">
                      <label className="label font-semibold">
                        <span className="label-text">
                          Phone Number ({formData.paymentMethod})
                        </span>
                      </label>
                      <input
                        name="phoneForMobileWallet"
                        value={formData.phoneForMobileWallet}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                        placeholder="e.g., 03001234567"
                        type="tel"
                      />
                      <label className="label">
                        <span className="label-text-alt text-xs opacity-60">
                          This phone number will receive the payment from admin
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Bank Account Payment */}
                  {formData.paymentMethod === "Bank Account" && (
                    <div className="form-control bg-success/10 p-4 rounded-lg border border-success/30">
                      <label className="label font-semibold">
                        <span className="label-text">IBAN Number</span>
                      </label>
                      <input
                        name="ibanNumber"
                        value={formData.ibanNumber}
                        onChange={handleChange}
                        className="input input-bordered w-full font-mono"
                        placeholder="PK94ABCD0010000000001234"
                      />
                      <label className="label">
                        <span className="label-text-alt text-xs opacity-60">
                          Enter your complete IBAN (International Bank Account
                          Number)
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Summary Display */}
                  {formData.paymentMethod && (
                    <div className="alert alert-success gap-3">
                      <span>
                        ✓ Payment Method:{" "}
                        <strong>{formData.paymentMethod}</strong>
                        {[
                          "EasyPaisa",
                          "JazzCash",
                          "Sadapay",
                          "Nayapay",
                        ].includes(formData.paymentMethod)
                          ? ` • Phone: ${
                              formData.phoneForMobileWallet || "Not set"
                            }`
                          : ` • IBAN: ${formData.ibanNumber || "Not set"}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {user?.role === "contractor" && (
              <>
                <div className="card bg-base-100 shadow-xl border border-base-300">
                  <div className="card-body">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                      <Briefcase className="text-secondary" /> Professional
                      Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="form-control">
                        <label className="label font-semibold">
                          Main Skill
                        </label>
                        <select
                          name="skill"
                          value={formData.skill}
                          onChange={handleChange}
                          className="select select-bordered"
                        >
                          <option value="Plumber">Plumber</option>
                          <option value="Electrician">Electrician</option>
                          <option value="Mason">Mason</option>
                          <option value="Carpenter">Carpenter</option>
                          <option value="Painter">Painter</option>
                          <option value="Welder">Welder</option>
                          <option value="HVAC">HVAC Technician</option>
                        </select>
                      </div>
                      <div className="form-control">
                        <label className="label font-semibold">
                          Work Setup
                        </label>
                        <select
                          name="teamType"
                          value={formData.teamType}
                          onChange={handleChange}
                          className="select select-bordered"
                        >
                          <option value="Individual">I work alone</option>
                          <option value="Team">I manage a team</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {formData.teamType === "Team" && (
                  <div className="card bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body">
                      <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Users className="text-accent" /> Team Management
                        </h3>
                        <button
                          type="button"
                          onClick={addTeamMember}
                          className="btn btn-sm btn-accent btn-outline gap-2"
                        >
                          <Plus size={16} /> Add Member
                        </button>
                      </div>
                      {teamMembers.length === 0 && (
                        <p className="opacity-50 text-center py-4">
                          No team members added yet.
                        </p>
                      )}
                      <div className="space-y-3">
                        {teamMembers.map((member, idx) => (
                          <div key={idx} className="flex gap-3 items-center">
                            <div className="join w-full">
                              <div className="flex items-center justify-center bg-base-200 px-3 border border-base-300 rounded-l-lg font-bold text-sm opacity-50">
                                #{idx + 1}
                              </div>
                              <input
                                placeholder="Member Name"
                                className="input input-bordered join-item w-full"
                                value={member.name}
                                onChange={(e) =>
                                  updateTeamMember(idx, "name", e.target.value)
                                }
                              />
                              <select
                                className="select select-bordered join-item w-48"
                                value={member.skill}
                                onChange={(e) =>
                                  updateTeamMember(idx, "skill", e.target.value)
                                }
                              >
                                <option value="Helper">Helper</option>
                                <option value="Plumber">Plumber</option>
                                <option value="Electrician">Electrician</option>
                                <option value="Mason">Mason</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTeamMember(idx)}
                              className="btn btn-square btn-error btn-outline"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="card bg-base-100 shadow-xl border border-base-300">
                  <div className="card-body">
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <ImageIcon className="text-warning" /> Portfolio
                      </h3>
                      <button
                        type="button"
                        onClick={() => portfolioInputRef.current.click()}
                        className="btn btn-sm btn-outline gap-2"
                      >
                        <Camera size={16} /> Upload
                      </button>
                      <input
                        type="file"
                        ref={portfolioInputRef}
                        onChange={handlePortfolioFileChange}
                        className="hidden"
                        multiple
                        accept="image/*"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {portfolioImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border"
                        >
                          <img
                            src={img.preview}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removePortfolioImage(idx)}
                              className="btn btn-circle btn-sm btn-error text-white"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
