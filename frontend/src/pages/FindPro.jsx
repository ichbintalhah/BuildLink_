import { useState } from "react";
import api from "../services/api";
import { Bot, Send, User, Star, ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const FindPro = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setResult(null);

    try {
      const { data } = await api.post("/ai/recommend", { query });
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Bot size={48} className="text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">BuildLink AI Assistant</h1>
          <p className="opacity-70">
            Describe your problem (e.g., "Kitchen sink is leaking") and AI will
            find the best pro.
          </p>
        </div>

        {/* Search Input */}
        <div className="card bg-base-100 shadow-xl mb-10">
          <div className="card-body">
            <form onSubmit={handleSearch} className="flex gap-4">
              <input
                type="text"
                placeholder="Describe your issue here..."
                className="input input-bordered w-full text-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <div className="animate-fade-in space-y-6">
            {/* AI Analysis Bubble */}
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full bg-primary/10 p-2">
                  <Bot size={24} className="text-primary" />
                </div>
              </div>
              <div className="chat-bubble chat-bubble-primary text-white">
                <strong>Analysis:</strong> {result.analysis}
              </div>
            </div>

            <div className="divider">Recommended {result.skill}s</div>

            {/* Contractor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {result.contractors.map((contractor) => (
                <div
                  key={contractor._id}
                  className="card bg-base-100 shadow-md border border-base-300 hover:shadow-xl transition-all"
                >
                  <div className="card-body">
                    <h2 className="card-title text-primary">
                      <User /> {contractor.fullName}
                    </h2>
                    <p className="text-sm opacity-70">
                      Expert {contractor.skill} •{" "}
                      {contractor.teamType || "Individual"}
                    </p>
                    <div className="flex gap-2 my-2">
                      <div
                        className={`badge text-white text-xs ${
                          contractor.availabilityStatus === "Available" ||
                          contractor.availability === "Green"
                            ? "badge-success"
                            : "badge-error"
                        }`}
                      >
                        {contractor.availabilityStatus === "Available" ||
                        contractor.availability === "Green"
                          ? "Available"
                          : "Busy"}
                      </div>
                      <div className="badge badge-ghost text-xs flex gap-1">
                        <Star size={10} />{" "}
                        {contractor.rating
                          ? contractor.rating.toFixed(1)
                          : "New"}
                      </div>
                      {contractor.isTrusted && (
                        <div className="badge badge-success text-white text-xs">
                          Trusted
                        </div>
                      )}
                    </div>
                    <div className="card-actions justify-end mt-4 flex gap-2">
                      <Link
                        to={`/profile?contractor=${contractor._id}`}
                        className="btn btn-sm btn-outline btn-primary"
                      >
                        View Profile <ArrowRight size={16} />
                      </Link>
                      {/* STEP 8 FIX: Removed WhatsApp direct contact to force platform-only communication */}
                      {/* Users must book through platform, not contact contractor directly */}
                      <button
                        className="btn btn-sm btn-outline btn-success"
                        title="Book a service with this contractor"
                        onClick={() => {
                          // Navigate to booking page or show booking modal
                          toast.success("Redirecting to booking...");
                          // You can add booking flow here
                        }}
                      >
                        <MessageCircle size={16} /> Book Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {result.contractors.length === 0 && (
              <div className="text-center opacity-50">
                <p>
                  No specific contractors found for this issue, but try
                  searching manually.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindPro;
