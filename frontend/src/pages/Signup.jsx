import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  User,
  Hammer,
  Users,
  Briefcase,
  ArrowLeft,
  Upload,
  AlertCircle,
  Check,
} from "lucide-react";

const Signup = () => {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  // Core State
  const [role, setRole] = useState("user"); // 'user' or 'contractor'

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    cnic: "",
    address: "",
    location: "",
    confirmPassword: "",
    // Contractor Basics
    skill: "Plumber",
    teamType: "Individual", // Default
    paymentMethod: "EasyPaisa",
    paymentAccount: "",
  });

  // Dynamic Team Members State
  const [teamMembers, setTeamMembers] = useState([{ name: "", skill: "" }]);

  // Picture Upload State
  const [pictures, setPictures] = useState({
    cnicFront: null,
    cnicBack: null,
    selfie: null,
  });

  const [picturePreview, setPicturePreview] = useState({
    cnicFront: null,
    cnicBack: null,
    selfie: null,
  });

  const [uploadingPicture, setUploadingPicture] = useState(null);

  // Handle Text Inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Picture Upload with Preview
  const handlePictureUpload = (e, pictureType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (3MB = 3145728 bytes)
    const MAX_SIZE = 3 * 1024 * 1024; // 3MB
    if (file.size > MAX_SIZE) {
      toast.error(
        `File size must be less than 3MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
      return;
    }

    // Validate file type (images only)
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }

    // Store file and create preview
    setPictures({ ...pictures, [pictureType]: file });

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPicturePreview({ ...picturePreview, [pictureType]: reader.result });
    };
    reader.readAsDataURL(file);

    toast.success(
      `${pictureType === "cnicFront" ? "CNIC Front" : pictureType === "cnicBack" ? "CNIC Back" : "Selfie"} photo uploaded`,
    );
  };

  const removePicture = (pictureType) => {
    setPictures({ ...pictures, [pictureType]: null });
    setPicturePreview({ ...picturePreview, [pictureType]: null });
  };

  // Handle Team Status Toggle
  const handleTeamTypeSelect = (type) => {
    setFormData({ ...formData, teamType: type });
  };

  // Handle Team Member Inputs
  const handleTeamChange = (index, field, value) => {
    const updatedTeam = [...teamMembers];
    updatedTeam[index][field] = value;
    setTeamMembers(updatedTeam);
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: "", skill: "" }]);
  };

  const removeTeamMember = (index) => {
    const updatedTeam = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(updatedTeam);
  };

  // SUBMIT HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Removed 8-character frontend enforcement per request

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate picture uploads (required for both users and contractors)
    if (!pictures.cnicFront || !pictures.cnicBack || !pictures.selfie) {
      toast.error(
        "All three pictures (CNIC front, CNIC back, and Selfie) are required",
      );
      return;
    }

    // Prepare FormData for file upload
    const formDataWithFiles = new FormData();

    // Add text fields
    const { confirmPassword, ...rest } = formData;
    Object.keys(rest).forEach((key) => {
      formDataWithFiles.append(key, rest[key]);
    });

    formDataWithFiles.append("role", role);

    // Add picture files
    formDataWithFiles.append("cnicFront", pictures.cnicFront);
    formDataWithFiles.append("cnicBack", pictures.cnicBack);
    formDataWithFiles.append("selfie", pictures.selfie);

    if (role === "contractor") {
      const contractorDetailsStr = JSON.stringify({
        skill: formData.skill,
        teamType: formData.teamType,
        paymentMethod: formData.paymentMethod,
        paymentAccount: formData.paymentAccount,
        teamMembers: formData.teamType === "Team" ? teamMembers : [],
      });
      formDataWithFiles.append("contractorDetails", contractorDetailsStr);
    }

    try {
      setSubmitting(true);
      await signup(formDataWithFiles);
      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Signup failed. Please verify your details and try again.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcut: Ctrl+Home or Cmd+Home to go home
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Home") {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 py-10 relative">
      {/* Go Back to Home Button - Top Left */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 btn btn-ghost btn-sm gap-2 hover:bg-base-200 focus:outline-2 focus:outline-offset-2 focus:outline-primary transition-colors z-10"
        aria-label="Go back to home page"
        title="Return to home (Ctrl+Home)"
      >
        <ArrowLeft size={18} />
        <span className="hidden sm:inline">Home</span>
      </button>

      <div className="card w-full max-w-4xl shadow-2xl bg-base-100 border border-base-200">
        <div className="card-body">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold mb-2">Create Account</h2>
            <p className="text-sm opacity-60">
              Join BuildLink as a Homeowner or Professional
            </p>
          </div>

          {/* Role Toggle - Modern Interactive Selection */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <p className="text-sm font-semibold opacity-70 uppercase tracking-wide">
                Who are you?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`
                  group relative px-6 sm:px-8 py-5 sm:py-6 rounded-2xl font-bold text-lg
                  transition-all duration-300 ease-out overflow-hidden
                  flex items-center justify-center gap-3
                  ${
                    role === "user"
                      ? "bg-gradient-to-br from-primary to-primary-focus text-white shadow-xl shadow-primary/40 scale-105"
                      : "bg-base-200 text-base-content hover:bg-base-300 border-2 border-transparent hover:border-primary/30"
                  }
                `}
                aria-pressed={role === "user"}
              >
                {/* Shine effect on active */}
                {role === "user" && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></span>
                )}
                <User
                  size={24}
                  className={`transition-transform duration-300 ${
                    role === "user" ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                <span className="relative z-10">Homeowner</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("contractor")}
                className={`
                  group relative px-6 sm:px-8 py-5 sm:py-6 rounded-2xl font-bold text-lg
                  transition-all duration-300 ease-out overflow-hidden
                  flex items-center justify-center gap-3
                  ${
                    role === "contractor"
                      ? "bg-gradient-to-br from-success to-success-focus text-white shadow-xl shadow-success/40 scale-105"
                      : "bg-base-200 text-base-content hover:bg-base-300 border-2 border-transparent hover:border-success/30"
                  }
                `}
                aria-pressed={role === "contractor"}
              >
                {/* Shine effect on active */}
                {role === "contractor" && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></span>
                )}
                <Hammer
                  size={24}
                  className={`transition-transform duration-300 ${
                    role === "contractor"
                      ? "scale-110 rotate-45"
                      : "group-hover:scale-110 group-hover:rotate-45"
                  }`}
                />
                <span className="relative z-10">Professional</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Full Name</span>
                </label>
                <input
                  name="fullName"
                  type="text"
                  placeholder="Ahsan"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Email</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="ahsankapoor@example.com"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Password</span>
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Confirm Password</span>
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Phone Number</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="03001234567"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">CNIC</span>
                </label>
                <input
                  name="cnic"
                  type="text"
                  placeholder="35202-1234567-1"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">Address</span>
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="House 123, Street 4, Lahore"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold">
                    Location (City/Area)
                  </span>
                </label>
                <input
                  name="location"
                  type="text"
                  placeholder="e.g., Lahore, Gulberg III"
                  className="input input-bordered w-full"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* PICTURE UPLOADS - Required for both Users and Contractors */}
            <div className="mt-8 pt-8 border-t border-base-300 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="alert alert-info mb-6" role="alert">
                <AlertCircle size={20} className="text-info" />
                <span>
                  <strong>Picture Requirements:</strong> All three pictures must
                  be clear, well-lit, and under 3MB each.
                </span>
              </div>

              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Upload className="text-success" /> Verification Pictures
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CNIC Front */}
                <div className="form-control border-2 border-dashed border-base-300 rounded-lg p-4 hover:border-primary transition-colors">
                  <label className="label">
                    <span className="label-text font-bold text-sm">
                      CNIC Front
                    </span>
                    {pictures.cnicFront && (
                      <Check size={20} className="text-success" />
                    )}
                  </label>
                  {picturePreview.cnicFront ? (
                    <div className="relative w-full mb-2">
                      <img
                        src={picturePreview.cnicFront}
                        alt="CNIC Front Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePicture("cnicFront")}
                        className="btn btn-sm btn-circle btn-error absolute top-1 right-1 text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload size={24} className="text-base-400 mb-1" />
                        <p className="text-xs text-base-500">Click to upload</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handlePictureUpload(e, "cnicFront")}
                        required={!pictures.cnicFront}
                      />
                    </label>
                  )}
                  <p className="text-xs text-base-500 mt-2">
                    📸 Clear front side of CNIC
                  </p>
                </div>

                {/* CNIC Back */}
                <div className="form-control border-2 border-dashed border-base-300 rounded-lg p-4 hover:border-primary transition-colors">
                  <label className="label">
                    <span className="label-text font-bold text-sm">
                      CNIC Back
                    </span>
                    {pictures.cnicBack && (
                      <Check size={20} className="text-success" />
                    )}
                  </label>
                  {picturePreview.cnicBack ? (
                    <div className="relative w-full mb-2">
                      <img
                        src={picturePreview.cnicBack}
                        alt="CNIC Back Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePicture("cnicBack")}
                        className="btn btn-sm btn-circle btn-error absolute top-1 right-1 text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload size={24} className="text-base-400 mb-1" />
                        <p className="text-xs text-base-500">Click to upload</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handlePictureUpload(e, "cnicBack")}
                        required={!pictures.cnicBack}
                      />
                    </label>
                  )}
                  <p className="text-xs text-base-500 mt-2">
                    📸 Clear back side of CNIC
                  </p>
                </div>

                {/* Selfie */}
                <div className="form-control border-2 border-dashed border-base-300 rounded-lg p-4 hover:border-primary transition-colors">
                  <label className="label">
                    <span className="label-text font-bold text-sm">Selfie</span>
                    {pictures.selfie && (
                      <Check size={20} className="text-success" />
                    )}
                  </label>
                  {picturePreview.selfie ? (
                    <div className="relative w-full mb-2">
                      <img
                        src={picturePreview.selfie}
                        alt="Selfie Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePicture("selfie")}
                        className="btn btn-sm btn-circle btn-error absolute top-1 right-1 text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-base-300 rounded-lg cursor-pointer hover:bg-base-200 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload size={24} className="text-base-400 mb-1" />
                        <p className="text-xs text-base-500">Click to upload</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handlePictureUpload(e, "selfie")}
                        required={!pictures.selfie}
                      />
                    </label>
                  )}
                  <p className="text-xs text-base-500 mt-2">
                    🤳 Clear face photo (selfie)
                  </p>
                </div>
              </div>
            </div>

            {/* CONTRACTOR SPECIFIC FIELDS */}
            {role === "contractor" && (
              <div className="mt-8 pt-8 border-t border-base-300 animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Briefcase className="text-primary" /> Professional Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">
                        Skill / Trade
                      </span>
                    </label>
                    <select
                      name="skill"
                      className="select select-bordered w-full"
                      onChange={handleChange}
                    >
                      <option>Plumber</option>
                      <option>Electrician</option>
                      <option>Mason</option>
                      <option>Carpenter</option>
                      <option>Painter</option>
                      <option>Welder</option>
                      <option>Glass Worker</option>
                      <option>HVAC</option>
                      <option>Helper</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">Work Type</span>
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        className={`btn flex-1 ${
                          formData.teamType === "Individual"
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                        onClick={() => handleTeamTypeSelect("Individual")}
                      >
                        <User size={18} /> Individual
                      </button>
                      <button
                        type="button"
                        className={`btn flex-1 ${
                          formData.teamType === "Team"
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                        onClick={() => handleTeamTypeSelect("Team")}
                      >
                        <Users size={18} /> Team
                      </button>
                    </div>
                  </div>
                </div>

                {/* Team Members Section */}
                {formData.teamType === "Team" && (
                  <div className="bg-base-200 p-4 rounded-xl mb-4">
                    <label className="label font-bold">Team Members</label>
                    {teamMembers.map((member, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Name"
                          className="input input-bordered flex-1"
                          value={member.name}
                          onChange={(e) =>
                            handleTeamChange(index, "name", e.target.value)
                          }
                          required
                        />
                        <input
                          type="text"
                          placeholder="Skill"
                          className="input input-bordered flex-1"
                          value={member.skill}
                          onChange={(e) =>
                            handleTeamChange(index, "skill", e.target.value)
                          }
                          required
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            className="btn btn-square btn-error text-white"
                            onClick={() => removeTeamMember(index)}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost gap-2 mt-2"
                      onClick={addTeamMember}
                    >
                      <Plus size={16} /> Add Member
                    </button>
                  </div>
                )}

                {/* Payment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">
                        Payment Method
                      </span>
                    </label>
                    <select
                      name="paymentMethod"
                      className="select select-bordered w-full"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      required
                    >
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="SadaPay">SadaPay</option>
                      <option value="NayaPay">NayaPay</option>
                      <option value="Bank Account">Bank Account</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-secondary">
                        {formData.paymentMethod === "Bank Account"
                          ? "IBAN Number"
                          : `${formData.paymentMethod} Phone Number`}
                      </span>
                    </label>
                    <input
                      name="paymentAccount"
                      type="text"
                      placeholder={
                        formData.paymentMethod === "Bank Account"
                          ? "PK36MEZN0000000001234567890"
                          : "0300-1234567"
                      }
                      className="input input-bordered w-full"
                      value={formData.paymentAccount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* HOMEOWNER PAYMENT DETAILS */}
            {role === "user" && (
              <div className="mt-8 pt-8 border-t border-base-300 animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Briefcase className="text-primary" /> Payment Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold">
                        Payment Method
                      </span>
                    </label>
                    <select
                      name="paymentMethod"
                      className="select select-bordered w-full"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      required
                    >
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="SadaPay">SadaPay</option>
                      <option value="NayaPay">NayaPay</option>
                      <option value="Bank Account">Bank Account</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-secondary">
                        {formData.paymentMethod === "Bank Account"
                          ? "IBAN Number"
                          : `${formData.paymentMethod} Phone Number`}
                      </span>
                    </label>
                    <input
                      name="paymentAccount"
                      type="text"
                      placeholder={
                        formData.paymentMethod === "Bank Account"
                          ? "PK36MEZN0000000001234567890"
                          : "0300-1234567"
                      }
                      className="input input-bordered w-full"
                      value={formData.paymentAccount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full text-lg mt-4 shadow-lg"
              disabled={submitting}
            >
              {submitting
                ? "Creating account..."
                : role === "contractor"
                  ? "Register as Contractor"
                  : "Register as Homeowner"}
            </button>
          </form>

          <p className="text-center mt-4 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary font-bold">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
