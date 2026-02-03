import { useState, useEffect } from "react";
import api from "../services/api";
import { DollarSign, Star, Calendar } from "lucide-react";
import PageLoader from "./PageLoader"; // STEP 2: Use custom loader

/**
 * STEP 2: Contractor Earnings History Component
 * Displays detailed earnings with:
 * - Client name
 * - Job title
 * - Completion date
 * - Amount earned
 * - Rating & review (if exists)
 */
const EarningsHistory = () => {
  const [earnings, setEarnings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    fetchEarningsHistory();
  }, []);

  const fetchEarningsHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get("/bookings/earnings/history");
      console.log("[EarningsHistory] Fetched data:", response.data);

      setEarnings(response.data.earnings || []);
      setTotalEarnings(response.data.totalEarnings || 0);
    } catch (err) {
      console.error("[EarningsHistory] Error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load earnings history";
      setError(errorMsg);
      setEarnings([]);
      setTotalEarnings(0);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Group earnings by month
  const groupedByMonth = {};
  earnings.forEach((earning) => {
    const date = new Date(earning.completionDate);
    const month = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    if (!groupedByMonth[month]) {
      groupedByMonth[month] = [];
    }
    groupedByMonth[month].push(earning);
  });

  if (isLoading) {
    return (
      <PageLoader isLoading={true} message="Loading earnings history..." />
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 pt-6">
        <div className="alert alert-error">
          <h3 className="font-bold">Failed to load earnings</h3>
          <p className="text-sm">{error}</p>
          <button onClick={fetchEarningsHistory} className="btn btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign size={32} />
          <h1 className="text-3xl font-bold">Earnings History</h1>
        </div>
        <p className="opacity-90">
          Total Earned: Rs. {totalEarnings.toLocaleString()}
        </p>
      </div>

      {/* No Earnings */}
      {earnings.length === 0 ? (
        <div className="card bg-base-100 shadow-lg border-l-4 border-warning p-6 text-center">
          <p className="text-base-content/70 mb-4">
            No completed jobs yet. Start accepting jobs to build your earnings
            history!
          </p>
        </div>
      ) : (
        /* STEP 2: Group by month */
        Object.entries(groupedByMonth)
          .sort(([monthA], [monthB]) => new Date(monthB) - new Date(monthA))
          .map(([month, jobs]) => (
            <div key={month} className="space-y-4">
              {/* Month Header */}
              <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
                <Calendar size={24} className="text-primary" />
                {month}
              </h2>

              {/* STEP 2: Earnings Cards */}
              <div className="grid gap-4">
                {jobs.map((earning) => (
                  <div
                    key={earning._id}
                    className="card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition"
                  >
                    <div className="card-body">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {/* Client & Job */}
                        <div className="md:col-span-2">
                          <p className="text-xs font-bold text-primary uppercase">
                            Client
                          </p>
                          <h3 className="text-lg font-bold text-base-content">
                            {earning.clientName}
                          </h3>
                          <p className="text-sm text-base-content/70">
                            {earning.jobTitle}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="md:col-span-1">
                          <p className="text-xs font-bold text-success uppercase">
                            Amount Earned
                          </p>
                          <p className="text-2xl font-bold text-success">
                            Rs. {earning.amountEarned.toLocaleString()}
                          </p>
                        </div>

                        {/* Date */}
                        <div className="md:col-span-1">
                          <p className="text-xs font-bold text-base-content/60 uppercase">
                            Completed
                          </p>
                          <p className="text-sm font-semibold text-base-content">
                            {new Date(
                              earning.completionDate
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Rating */}
                        <div className="md:col-span-1">
                          {earning.rating ? (
                            <div>
                              <p className="text-xs font-bold text-warning uppercase">
                                Rating
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${
                                      i < earning.rating
                                        ? "text-warning"
                                        : "text-base-300"
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-base-content/70 mt-1">
                                {earning.rating}.0 stars
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-bold text-base-content/60 uppercase">
                                Rating
                              </p>
                              <p className="text-sm text-base-content/70">
                                No rating yet
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Review Text */}
                      {earning.reviewText && (
                        <div className="mt-4 pt-4 border-t border-base-300">
                          <p className="text-xs font-bold text-base-content/60 uppercase">
                            Client Review
                          </p>
                          <p className="text-sm text-base-content italic mt-2">
                            "{earning.reviewText}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Month Summary */}
              <div className="stats shadow-md border border-base-300 bg-base-100">
                <div className="stat">
                  <div className="stat-title">Jobs This Month</div>
                  <div className="stat-value text-primary">{jobs.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Total This Month</div>
                  <div className="stat-value text-success">
                    Rs.{" "}
                    {jobs
                      .reduce((sum, j) => sum + j.amountEarned, 0)
                      .toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))
      )}
    </div>
  );
};

export default EarningsHistory;
