const Booking = require("../models/Booking");
const Dispute = require("../models/Dispute");
const {
  round2,
  splitNormal,
  splitDispute,
  ADMIN_COMMISSION_RATE,
} = require("../utils/financeUtils");

/**
 * Build a date-range filter from query params.
 * Supports:  ?month=3&year=2026   → March 2026
 *            ?year=2026           → Full year 2026
 *            (no params)          → All time
 */
const buildDateRange = (query) => {
  const { month, year } = query;
  if (!year) return {}; // all-time

  const y = parseInt(year, 10);
  if (month) {
    const m = parseInt(month, 10) - 1; // JS months are 0-based
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1); // first day of next month
    return { $gte: start, $lt: end };
  }
  // Full year
  const start = new Date(y, 0, 1);
  const end = new Date(y + 1, 0, 1);
  return { $gte: start, $lt: end };
};

// ──────────────────────────────────────
// @desc    Get Financial Analytics Metrics
// @route   GET /api/analytics/financial
// @access  Admin only
// ──────────────────────────────────────
const getFinancialAnalytics = async (req, res) => {
  try {
    const dateRange = buildDateRange(req.query);
    const hasDateFilter = Object.keys(dateRange).length > 0;

    const createDisputeBucket = () => ({
      count: 0,
      volume: 0,
      admin: 0,
      contractor: 0,
      refund: 0,
    });

    // ── 1. RESOLVE DISPUTES FIRST ──────────────────────────────
    // We need the set of disputed booking IDs so step 2 can
    // exclude them from the "completed" volume.
    const disputeMatch = { status: "Resolved" };
    if (hasDateFilter) disputeMatch.updatedAt = dateRange;

    const resolvedDisputes = await Dispute.find(disputeMatch)
      .sort({ updatedAt: -1 })
      .populate("user", "fullName email")
      .populate("contractor", "fullName email")
      .populate({
        path: "booking",
        select:
          "totalPrice bookingType paymentSchedule currentMilestone status paymentStatus user contractor",
        populate: [
          { path: "user", select: "fullName email" },
          { path: "contractor", select: "fullName email" },
        ],
      })
      .lean();

    const disputeBookingIds = new Set();
    let disputeAdmin = 0;
    let disputeContractor = 0;
    let disputeRefunds = 0;
    let disputedVolume = 0;
    const disputeCases = [];
    const disputeBreakdown = {
      Refund: createDisputeBucket(),
      Release: createDisputeBucket(),
      Split: createDisputeBucket(),
    };

    for (const d of resolvedDisputes) {
      if (!d.booking) continue;
      disputeBookingIds.add(d.booking._id.toString());

      const bk = d.booking;
      const isHeavyDuty =
        bk.bookingType === "heavy-duty-construction" &&
        bk.paymentSchedule &&
        bk.paymentSchedule.length > 0;

      // Determine the amount that was disputed
      let amount;
      if (isHeavyDuty) {
        const idx = bk.currentMilestone || 0;
        amount = bk.paymentSchedule[idx]?.amount || bk.totalPrice;
      } else {
        amount = bk.totalPrice;
      }

      // splitDispute uses the remainder method:
      //   split.admin + split.contractor + split.refund === amount
      const split = splitDispute(amount, d.adminDecision);
      disputeAdmin += split.admin;
      disputeContractor += split.contractor;
      disputeRefunds += split.refund;
      disputedVolume += amount;

      const userName =
        d.user?.fullName || d.booking?.user?.fullName || "Unknown User";
      const contractorName =
        d.contractor?.fullName ||
        d.booking?.contractor?.fullName ||
        "Unknown Contractor";

      disputeCases.push({
        id: d._id,
        decision: d.adminDecision,
        amount: round2(amount),
        admin: split.admin,
        contractor: split.contractor,
        refund: split.refund,
        userName,
        contractorName,
        resolvedAt: d.updatedAt,
      });

      if (disputeBreakdown[d.adminDecision]) {
        const bucket = disputeBreakdown[d.adminDecision];
        bucket.count += 1;
        bucket.volume += amount;
        bucket.admin += split.admin;
        bucket.contractor += split.contractor;
        bucket.refund += split.refund;
      }
    }

    // Round accumulated dispute totals
    disputeAdmin = round2(disputeAdmin);
    disputeContractor = round2(disputeContractor);
    disputeRefunds = round2(disputeRefunds);
    disputedVolume = round2(disputedVolume);

    // Ensure dispute equation balances after accumulation
    // (adjust refunds for any sub-cent floating-point drift)
    const disputePartsSum = round2(
      disputeAdmin + disputeContractor + disputeRefunds,
    );
    if (disputePartsSum !== disputedVolume) {
      disputeRefunds = round2(
        disputedVolume - disputeAdmin - disputeContractor,
      );
    }

    for (const decision of Object.keys(disputeBreakdown)) {
      const bucket = disputeBreakdown[decision];
      bucket.volume = round2(bucket.volume);
      bucket.admin = round2(bucket.admin);
      bucket.contractor = round2(bucket.contractor);
      bucket.refund = round2(bucket.refund);

      const bucketParts = round2(
        bucket.admin + bucket.contractor + bucket.refund,
      );
      if (bucketParts !== bucket.volume) {
        bucket.refund = round2(
          bucket.volume - bucket.admin - bucket.contractor,
        );
      }
    }

    // ── 2. COMPLETED BOOKINGS (excluding disputed ones) ──────
    // Only non-disputed completed bookings count in completed volume.
    // This fixes the bug where totalCustomerSpend included disputed
    // bookings but the admin/contractor splits excluded them —
    // causing the equation to break (e.g. 4300 ≠ 200 + 3800).
    const completedMatch = {
      status: { $in: ["Completed", "Completed_And_Confirmed"] },
      paymentStatus: "Completed",
    };
    if (hasDateFilter) completedMatch.updatedAt = dateRange;

    const allCompleted = await Booking.find(completedMatch)
      .select("_id totalPrice user contractor serviceName updatedAt")
      .populate("user", "fullName email")
      .populate("contractor", "fullName email")
      .sort({ updatedAt: -1 })
      .lean();

    const completedCases = [];
    let completedVolume = 0;
    let completedAdmin = 0;
    let completedContractor = 0;
    let completedCount = 0;
    for (const bk of allCompleted) {
      if (!disputeBookingIds.has(bk._id.toString())) {
        const amount = round2(bk.totalPrice || 0);
        const split = splitNormal(amount);

        completedVolume += amount;
        completedAdmin += split.admin;
        completedContractor += split.contractor;
        completedCount++;

        completedCases.push({
          id: bk._id,
          serviceName: bk.serviceName || "Service",
          amount,
          admin: split.admin,
          contractor: split.contractor,
          userName: bk.user?.fullName || "Unknown User",
          contractorName: bk.contractor?.fullName || "Unknown Contractor",
          completedAt: bk.updatedAt,
        });
      }
    }
    completedVolume = round2(completedVolume);
    completedAdmin = round2(completedAdmin);
    completedContractor = round2(completedContractor);

    if (round2(completedAdmin + completedContractor) !== completedVolume) {
      completedContractor = round2(completedVolume - completedAdmin);
    }

    // Completed totals are summed from per-booking splits, so:
    //   completedAdmin + completedContractor === completedVolume

    // ── 3. AGGREGATE TOTALS ──────────────────────────────────
    const totalAdminCommission = round2(completedAdmin + disputeAdmin);
    const totalContractorPayouts = round2(
      completedContractor + disputeContractor,
    );
    const totalPlatformVolume = round2(completedVolume + disputedVolume);
    const totalRevenue = totalAdminCommission;

    // ── 4. MONTHLY TREND (last 12 months or within year) ─────
    const trendMatch = {
      status: { $in: ["Completed", "Completed_And_Confirmed"] },
      paymentStatus: "Completed",
    };
    if (hasDateFilter) trendMatch.updatedAt = dateRange;

    const monthlyTrend = await Booking.aggregate([
      { $match: trendMatch },
      {
        $group: {
          _id: {
            year: { $year: "$updatedAt" },
            month: { $month: "$updatedAt" },
          },
          spend: { $sum: "$totalPrice" },
          jobs: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Format monthly trend
    const trend = monthlyTrend.map((m) => ({
      year: m._id.year,
      month: m._id.month,
      label: new Date(m._id.year, m._id.month - 1).toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      spend: m.spend,
      commission: splitNormal(m.spend).admin,
      jobs: m.jobs,
    }));

    // ── 5. TOP SERVICES BREAKDOWN ────────────────────────────
    const servicesMatch = {
      status: { $in: ["Completed", "Completed_And_Confirmed"] },
      paymentStatus: "Completed",
    };
    if (hasDateFilter) servicesMatch.updatedAt = dateRange;

    const topServices = await Booking.aggregate([
      { $match: servicesMatch },
      {
        $group: {
          _id: "$serviceName",
          revenue: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]);

    res.json({
      // ── Completed bookings (non-disputed) ──
      completedVolume,
      completedAdmin,
      completedContractor,
      completedBookings: completedCount,
      completedCases,

      // ── Disputed bookings ──
      disputedVolume,
      disputeAdmin,
      disputeContractor,
      disputeRefunds,
      disputeCount: resolvedDisputes.length,
      disputeBreakdown: {
        refund: disputeBreakdown.Refund,
        release: disputeBreakdown.Release,
        split: disputeBreakdown.Split,
      },
      disputeCases,

      // ── Aggregated totals ──
      totalPlatformVolume,
      totalAdminCommission,
      totalContractorPayouts,
      totalRevenue,

      commissionRate: ADMIN_COMMISSION_RATE,
      trend,
      topServices: topServices.map((s) => ({
        service: s._id,
        revenue: s.revenue,
        count: s.count,
      })),
    });
  } catch (error) {
    console.error("Financial Analytics Error:", error);
    res.status(500).json({ message: "Server Error fetching analytics" });
  }
};

// ──────────────────────────────────────
// @desc    Export Financial Report (JSON download)
// @route   GET /api/analytics/export
// @access  Admin only
// ──────────────────────────────────────
const exportFinancialReport = async (req, res) => {
  try {
    const dateRange = buildDateRange(req.query);
    const hasDateFilter = Object.keys(dateRange).length > 0;
    const createDisputeBucket = () => ({
      count: 0,
      volume: 0,
      admin: 0,
      contractor: 0,
      refund: 0,
    });
    const csvSafe = (value) =>
      String(value ?? "")
        .replace(/,/g, " ")
        .replace(/\n/g, " ")
        .trim();

    const match = {
      status: { $in: ["Completed", "Completed_And_Confirmed"] },
      paymentStatus: "Completed",
    };
    if (hasDateFilter) match.updatedAt = dateRange;

    const bookings = await Booking.find(match)
      .populate("user", "fullName email")
      .populate("contractor", "fullName email")
      .select(
        "serviceName totalPrice status paymentStatus bookingType createdAt updatedAt",
      )
      .sort({ updatedAt: -1 })
      .lean();

    // Build CSV content
    const header = [
      "Date",
      "Service",
      "Customer",
      "Contractor",
      "Total (Rs.)",
      "Commission (Rs.)",
      "Contractor Payout (Rs.)",
      "Type",
      "Status",
    ].join(",");

    const rows = bookings.map((b) => {
      const { admin: commission, contractor: payout } = splitNormal(
        b.totalPrice,
      );
      const date = new Date(b.updatedAt).toLocaleDateString("en-PK");
      const customer = b.user?.fullName?.replace(/,/g, " ") || "N/A";
      const contractor = b.contractor?.fullName?.replace(/,/g, " ") || "N/A";
      const service = (b.serviceName || "").replace(/,/g, " ");
      const type =
        b.bookingType === "heavy-duty-construction" ? "Heavy Duty" : "Regular";

      return [
        date,
        service,
        customer,
        contractor,
        b.totalPrice,
        commission,
        payout,
        type,
        b.status,
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");

    // Summary row — use splitNormal on aggregate for a balanced equation
    const totalSpend = round2(bookings.reduce((s, b) => s + b.totalPrice, 0));
    const { admin: totalCommission, contractor: totalPayout } =
      splitNormal(totalSpend);

    const summary = `\nSUMMARY\nTotal Bookings,${bookings.length}\nTotal Customer Spend,Rs. ${totalSpend}\nTotal Admin Commission,Rs. ${totalCommission}\nTotal Contractor Payouts,Rs. ${totalPayout}`;

    const disputeMatch = { status: "Resolved" };
    if (hasDateFilter) disputeMatch.updatedAt = dateRange;

    const exportDisputes = await Dispute.find(disputeMatch)
      .sort({ updatedAt: -1 })
      .populate("user", "fullName email")
      .populate("contractor", "fullName email")
      .populate({
        path: "booking",
        select:
          "totalPrice bookingType paymentSchedule currentMilestone serviceName user contractor",
      })
      .lean();

    const disputeBuckets = {
      Refund: createDisputeBucket(),
      Release: createDisputeBucket(),
      Split: createDisputeBucket(),
    };

    const disputeRows = exportDisputes
      .map((d) => {
        if (!d.booking) return null;

        const bk = d.booking;
        const isHeavyDuty =
          bk.bookingType === "heavy-duty-construction" &&
          bk.paymentSchedule &&
          bk.paymentSchedule.length > 0;

        let amount;
        if (isHeavyDuty) {
          const idx = bk.currentMilestone || 0;
          amount = bk.paymentSchedule[idx]?.amount || bk.totalPrice;
        } else {
          amount = bk.totalPrice;
        }

        const split = splitDispute(amount, d.adminDecision);
        const decisionBucket = disputeBuckets[d.adminDecision];
        if (decisionBucket) {
          decisionBucket.count += 1;
          decisionBucket.volume += amount;
          decisionBucket.admin += split.admin;
          decisionBucket.contractor += split.contractor;
          decisionBucket.refund += split.refund;
        }

        const date = new Date(d.updatedAt).toLocaleDateString("en-PK");
        const userName =
          d.user?.fullName || d.booking?.user?.fullName || "Unknown User";
        const contractorName =
          d.contractor?.fullName ||
          d.booking?.contractor?.fullName ||
          "Unknown Contractor";

        return [
          date,
          d.adminDecision || "Pending",
          csvSafe(userName),
          csvSafe(contractorName),
          round2(amount),
          split.admin,
          split.contractor,
          split.refund,
        ].join(",");
      })
      .filter(Boolean);

    Object.values(disputeBuckets).forEach((bucket) => {
      bucket.volume = round2(bucket.volume);
      bucket.admin = round2(bucket.admin);
      bucket.contractor = round2(bucket.contractor);
      bucket.refund = round2(bucket.refund);
      const parts = round2(bucket.admin + bucket.contractor + bucket.refund);
      if (parts !== bucket.volume) {
        bucket.refund = round2(
          bucket.volume - bucket.admin - bucket.contractor,
        );
      }
    });

    const disputeSummaryRows = Object.entries(disputeBuckets)
      .filter(([, bucket]) => bucket.count > 0)
      .map(([decision, bucket]) =>
        [
          decision,
          bucket.count,
          bucket.volume,
          bucket.admin,
          bucket.contractor,
          bucket.refund,
        ].join(","),
      );

    const disputeSummarySection =
      disputeSummaryRows.length > 0
        ? `\n\nDISPUTE_DECISION_SUMMARY\nDecision,Cases,Volume (Rs.),Admin (Rs.),Contractor (Rs.),User Refund (Rs.)\n${disputeSummaryRows.join("\n")}`
        : "";

    const disputeCasesSection =
      disputeRows.length > 0
        ? `\n\nDISPUTE_CASES\nDate,Decision,User,Contractor,Amount (Rs.),Admin (Rs.),Contractor (Rs.),User Refund (Rs.)\n${disputeRows.join("\n")}`
        : "";

    const fullCsv = csv + summary + disputeSummarySection + disputeCasesSection;

    // Determine filename
    const { month, year } = req.query;
    let filename = "BuildLink_Financial_Report";
    if (year) filename += `_${year}`;
    if (month) filename += `_${String(month).padStart(2, "0")}`;
    filename += ".csv";

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(fullCsv);
  } catch (error) {
    console.error("Export Report Error:", error);
    res.status(500).json({ message: "Server Error exporting report" });
  }
};

module.exports = {
  getFinancialAnalytics,
  exportFinancialReport,
};
