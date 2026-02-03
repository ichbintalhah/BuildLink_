import { useEffect, useState, useContext } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { MapPin, Star } from "lucide-react";
import BookingModal from "../components/BookingModal";

const ServiceList = () => {
  const { category } = useParams(); // e.g., "plumber"
  const [searchParams] = useSearchParams();
  const selectedJob = searchParams.get("job"); // "Install Sink"
  const fixedPrice = searchParams.get("price");

  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState(null);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Normalize category to a canonical skill for API filtering
  const normalizedCategory = decodeURIComponent(category || "")
    .trim()
    .toLowerCase();

  const skillMap = {
    plumber: "Plumber",
    electrician: "Electrician",
    carpenter: "Carpenter",
    mason: "Mason",
    painter: "Painter",
    welder: "Welder",
    "glass worker": "Glass Worker",
    helper: "Helper",
    hvac: "HVAC",
  };

  const skillParam = skillMap[normalizedCategory] || normalizedCategory;
  const displayCategory = skillMap[normalizedCategory] || normalizedCategory;

  // Normalize a skill string locally to guard against stray spacing/casing
  const normalizeSkillValue = (value) =>
    (value || "").toString().trim().replace(/\s+/g, " ").toLowerCase();

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        // Backend search with normalized skill value
        const { data } = await api.get(
          `/users/contractors?skill=${encodeURIComponent(skillParam)}`,
        );
        // Client-side defensive filter in case any legacy records slip through
        const normalizedTarget = normalizeSkillValue(skillParam);
        const safeFiltered = data.filter(
          (c) =>
            normalizeSkillValue(c.skill) === normalizedTarget ||
            normalizeSkillValue(c.skillNormalized) === normalizedTarget,
        );
        setContractors(safeFiltered);
      } catch (error) {
        console.error("Failed to fetch contractors");
      } finally {
        setLoading(false);
      }
    };
    fetchContractors();
  }, [skillParam]);

  const handleBookClick = (contractor) => {
    if (!user) {
      navigate("/login");
    } else {
      setSelectedContractor(contractor);
      document.getElementById("booking_modal").showModal();
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold capitalize">
          Available {displayCategory}s
        </h1>
        <div className="badge badge-primary badge-lg mt-3 p-4">
          Job: {selectedJob || "General Service"}
          {fixedPrice && ` (~Rs. ${fixedPrice})`}
        </div>
      </div>

      {loading ? (
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {contractors.map((contractor) => (
            <div
              key={contractor._id}
              className="card bg-base-100 shadow-xl border border-base-300"
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title text-2xl">
                      {contractor.fullName}
                    </h2>
                    <div className="badge badge-secondary badge-outline mt-1">
                      {contractor.teamType}
                    </div>
                  </div>
                  <div
                    className={`badge ${
                      contractor.availability === "Green"
                        ? "badge-success"
                        : "badge-error"
                    } gap-2 text-white`}
                  >
                    {contractor.availability === "Green" ? "Available" : "Busy"}
                  </div>
                </div>

                <p className="flex items-center gap-2 text-gray-500 mt-2">
                  <MapPin size={16} /> {contractor.address}
                </p>

                <div className="card-actions justify-end mt-4">
                  <button
                    disabled={contractor.availability === "Red"}
                    onClick={() => handleBookClick(contractor)}
                    className="btn btn-primary w-full"
                  >
                    Select & Book
                  </button>
                </div>
              </div>
            </div>
          ))}

          {contractors.length === 0 && (
            <div className="col-span-full text-center py-20 opacity-50">
              <h3 className="text-2xl font-bold">
                No {displayCategory}s found.
              </h3>
            </div>
          )}
        </div>
      )}

      {/* Pass selectedJob to the modal so it pre-fills the form */}
      <BookingModal
        contractor={selectedContractor}
        defaultJob={selectedJob}
        fixedPrice={fixedPrice}
      />
    </div>
  );
};

export default ServiceList;
