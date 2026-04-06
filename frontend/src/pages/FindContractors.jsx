import { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import PageLoader from "../components/PageLoader";
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Filter,
  ArrowRight,
} from "lucide-react";

const FindContractors = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("All");

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const { data } = await api.get("/contractors");
        setContractors(data);
      } catch (error) {
        console.error("Failed to fetch contractors", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContractors();
  }, []);

  // Filter Logic
  const filteredContractors = contractors.filter((c) => {
    const matchesSearch =
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase())) ||
      (c.location && c.location.toLowerCase().includes(search.toLowerCase()));
    const matchesSkill = skillFilter === "All" || c.skill === skillFilter;

    return matchesSearch && matchesSkill;
  });

  const skills = [
    "All",
    "Plumber",
    "Electrician",
    "Carpenter",
    "Mason",
    "Painter",
    "Welder",
    "HVAC",
    "Heavy Duty Construction",
  ];

  return (
    <div className="min-h-screen bg-base-200 font-sans">
      <PageLoader isLoading={loading} message="Locating professionals..." />

      {/* --- HEADER SECTION --- */}
      <div className="bg-primary text-primary-content pt-16 pb-24 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80')",
          }}
        ></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Pro</h1>
          <p className="opacity-90 text-lg">
            Connect with top-rated, verified local professionals for your next
            project.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10 pb-20 relative z-20">
        {/* --- SEARCH & FILTERS BAR --- */}
        <div className="bg-base-100 rounded-xl shadow-xl p-4 md:p-6 mb-10 border border-base-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search
                className="absolute left-4 top-3.5 text-base-content/40"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name or location..."
                className="input input-bordered w-full pl-12 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Skill Pills */}
            <div className="hidden md:flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {skills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => setSkillFilter(skill)}
                  className={`btn btn-sm rounded-full px-4 border-none ${
                    skillFilter === skill
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "bg-base-200 hover:bg-base-300 text-base-content/70"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>

            {/* Mobile Dropdown */}
            <div className="md:hidden w-full">
              <select
                className="select select-bordered w-full"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
              >
                {skills.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- RESULTS GRID --- */}
        {filteredContractors.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Filter size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold">No professionals found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredContractors.map((contractor) => (
              <div
                key={contractor._id}
                className="card bg-base-100 shadow-md hover:shadow-2xl transition-all duration-300 border border-base-200 group"
              >
                <div className="card-body p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="avatar">
                        <div className="w-14 h-14 rounded-full ring ring-base-200 ring-offset-2">
                          {contractor.profilePicture ? (
                            <img
                              src={contractor.profilePicture}
                              alt={contractor.fullName}
                            />
                          ) : (
                            <div className="bg-neutral text-neutral-content rounded-full w-full h-full flex items-center justify-center">
                              <span className="text-2xl font-bold">
                                {contractor.fullName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h2 className="card-title text-lg flex items-center gap-1">
                          {contractor.fullName}
                          {contractor.isVerified && (
                            <ShieldCheck
                              size={16}
                              className="text-success fill-success/10"
                            />
                          )}
                        </h2>
                        <div className="flex items-center gap-1 text-sm text-base-content/60">
                          <MapPin size={14} /> {contractor.address || "Lahore"}
                        </div>
                      </div>
                    </div>
                    <div className="badge badge-warning gap-1 font-bold">
                      <Star size={12} className="fill-current" />
                      {contractor.rating ? contractor.rating.toFixed(1) : "New"}
                    </div>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <span className="badge badge-outline badge-primary font-medium p-3">
                      {contractor.skill || "General"}
                    </span>
                    <span className="badge badge-ghost opacity-70 p-3">
                      {contractor.teamType || "Individual"}
                    </span>
                    {/* Availability Status Badge */}
                    <span
                      className={`badge font-bold p-3 ${
                        contractor.availabilityStatus === "Available" ||
                        contractor.availability === "Green"
                          ? "badge-success text-white"
                          : "badge-error text-white"
                      }`}
                    >
                      {contractor.availabilityStatus === "Available" ||
                      contractor.availability === "Green"
                        ? "Available"
                        : "Busy"}
                    </span>
                    {contractor.isTrusted && (
                      <span className="badge badge-success gap-1">
                        <ShieldCheck size={12} /> Trusted
                      </span>
                    )}
                  </div>

                  <div className="card-actions justify-end mt-auto pt-4 border-t border-base-100">
                    <Link
                      to={`/profile?contractor=${contractor._id}`}
                      className="btn btn-primary w-full group-hover:bg-primary-focus transition-colors"
                    >
                      View Profile{" "}
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindContractors;
