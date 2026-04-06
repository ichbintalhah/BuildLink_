const Dispute = require("../models/Dispute");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Contractor = require("../models/Contractor");
const Notification = require("../models/Notification");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { updateContractorAvailability } = require("../utils/bookingScheduler");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Create Dispute (User)
const createDispute = async (req, res) => {
  try {
    const { bookingId, reason, userEvidence } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const existing = await Dispute.findOne({ booking: bookingId });
    if (existing)
      return res.status(400).json({ message: "Dispute already active." });

    const dispute = await Dispute.create({
      booking: bookingId,
      initiator: req.user._id,
      user: booking.user,
      contractor: booking.contractor,
      reason,
      userEvidence: userEvidence || [],
      status: "Open",
    });

    booking.status = "Disputed";
    booking.paymentStatus = "Held";
    booking.dispute = dispute._id;
    await booking.save();

    // ✅ NOTIFY ALL ADMINS about new dispute
    const admins = await User.find({ role: "admin" });
    const adminNotifications = admins.map((admin) => ({
      user: admin._id,
      message: `New Dispute: ${booking.serviceName} - ${reason}`,
      type: "alert",
      relatedBooking: booking._id,
      notifCategory: "dispute_created",
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    // ✅ NOTIFY CONTRACTOR about dispute
    await Notification.create({
      contractor: booking.contractor,
      message: `Dispute opened on your job: ${booking.serviceName}. Please submit your defense.`,
      type: "alert",
      relatedBooking: booking._id,
      notifCategory: "dispute_created",
    });

    console.log("✅ Dispute created and notifications sent", {
      disputeId: dispute._id,
      bookingId: booking._id,
      contractorId: booking.contractor,
    });

    res.status(201).json(dispute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Submit Defense (Contractor)
const submitDefense = async (req, res) => {
  try {
    const { defense, evidence } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { contractorDefense: defense, contractorEvidence: evidence || [], contractorDefenseAt: new Date() },
      { new: true },
    );

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // ✅ NOTIFY ADMINS that contractor submitted defense
    const admins = await User.find({ role: "admin" });
    const adminNotifications = admins.map((admin) => ({
      user: admin._id,
      message: `Contractor submitted defense for Dispute #${dispute._id.toString().slice(-6)}`,
      type: "info",
      relatedBooking: dispute.booking,
      notifCategory: "dispute_defense",
    }));
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }

    console.log("✅ Defense submitted and admins notified", {
      disputeId: dispute._id,
      contractorId: req.user._id,
    });

    res.json(dispute);
  } catch (error) {
    console.error("❌ Submit Defense Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// 3. ✅ NEW: Get My Disputes (List for Dashboard)
const getMyDisputes = async (req, res) => {
  try {
    let query = {};

    // If NOT Admin, only show disputes involved in
    if (req.user.role !== "admin") {
      const myBookings = await Booking.find({
        $or: [{ user: req.user._id }, { contractor: req.user._id }],
      }).select("_id");

      const bookingIds = myBookings.map((b) => b._id);
      query = { booking: { $in: bookingIds } };
    }

    const disputes = await Dispute.find(query)
      .populate({
        path: "booking",
        select:
          "serviceName totalPrice bookingType currentMilestone paymentSchedule user contractor",
        populate: [
          { path: "user", select: "fullName profilePicture" },
          { path: "contractor", select: "fullName profilePicture" },
        ],
      })
      .populate("user", "fullName profilePicture")
      .populate("contractor", "fullName profilePicture")
      .sort({ createdAt: -1 });

    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Get Details (Split Screen for Admin)
const getDisputeDetails = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate({
        path: "booking",
        populate: [
          { path: "user", select: "fullName email profilePicture" },
          { path: "contractor", select: "fullName email profilePicture" },
        ],
      })
      .populate("user", "fullName profilePicture")
      .populate("contractor", "fullName profilePicture");

    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    const booking = dispute.booking;

    // Get work images - for heavy duty, get current milestone images
    let workImages = booking.completionImages || [];
    if (
      booking.bookingType === "heavy-duty-construction" &&
      booking.paymentSchedule &&
      booking.paymentSchedule.length > 0
    ) {
      const currentMilestoneIndex = booking.currentMilestone || 0;
      const currentMilestone = booking.paymentSchedule[currentMilestoneIndex];
      workImages =
        currentMilestone?.completionImages || booking.completionImages || [];
    }

    const splitScreenData = {
      userSide: {
        name: dispute.user?.fullName || booking.user?.fullName,
        profilePicture: dispute.user?.profilePicture || booking.user?.profilePicture,
        claim: dispute.reason,
        evidence: dispute.userEvidence,
      },
      contractorSide: {
        name: dispute.contractor?.fullName || booking.contractor?.fullName,
        profilePicture: dispute.contractor?.profilePicture || booking.contractor?.profilePicture,
        defense: dispute.contractorDefense || "Pending defense...",
        evidence: dispute.contractorEvidence || [],
        workImages: workImages,
      },
      aiSummary: dispute.aiAnalysis || null,
    };

    res.json(splitScreenData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. AI Judge
const summarizeDisputeAI = async (req, res) => {
  try {
    // Validate API Key
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is missing");
      return res.status(500).json({ message: "AI service is not configured" });
    }

    console.log("Starting AI Summary for dispute:", req.params.id);

    const dispute = await Dispute.findById(req.params.id).populate("booking");
    if (!dispute) {
      console.error("❌ Dispute not found:", req.params.id);
      return res.status(404).json({ message: "Dispute not found" });
    }

    if (!dispute.booking) {
      console.error("❌ Booking not found for dispute:", req.params.id);
      return res.status(400).json({ message: "Associated booking not found" });
    }

    const prompt = `
You are an impartial construction dispute mediator. Analyze this service dispute:

HOMEOWNER CLAIM: "${dispute.reason}"
CONTRACTOR DEFENSE: "${dispute.contractorDefense || "No defense submitted yet"}"

Please provide:
1. Brief summary of the dispute
2. Analysis of both parties' positions
3. Key considerations
4. Fair recommendation for resolution

Keep your response clear, balanced, and professional.
        `;

    console.log("Sending request to Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("✅ AI Response received successfully");

    // Store the AI analysis in the dispute record for future reference
    dispute.aiAnalysis = text;
    await dispute.save();

    res.json({
      success: true,
      summary: text,
      analysis: text,
    });
  } catch (error) {
    console.error("❌ AI Summarize Error:", error);
    console.error("Error details:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to generate AI analysis. Please try again.",
      error: error.message,
    });
  }
};

// 6. Resolve Dispute
const resolveDispute = async (req, res) => {
  try {
    const { calculateDisputeSplit } = require("../utils/paymentService");
    const { decision, comment } = req.body;

    // Validate decision input
    if (!["Release", "Refund", "Split"].includes(decision)) {
      return res.status(400).json({
        message: "Invalid decision. Must be 'Release', 'Refund', or 'Split'",
      });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    const booking = await Booking.findById(dispute.booking).populate(
      "user contractor",
    );
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Determine the amount to dispute (milestone amount for heavy duty, totalPrice for regular)
    const isHeavyDuty =
      booking.bookingType === "heavy-duty-construction" &&
      booking.paymentSchedule &&
      booking.paymentSchedule.length > 0;

    let disputeAmount;
    let currentMilestoneIndex;

    if (isHeavyDuty) {
      currentMilestoneIndex = booking.currentMilestone || 0;
      const currentMilestone = booking.paymentSchedule[currentMilestoneIndex];
      disputeAmount = currentMilestone?.amount || booking.totalPrice;

      console.log("Heavy Duty Dispute - Calculating split for milestone:", {
        milestoneIndex: currentMilestoneIndex,
        milestoneAmount: disputeAmount,
        totalBookingPrice: booking.totalPrice,
      });
    } else {
      disputeAmount = booking.totalPrice;

      console.log("Regular Booking - Calculating dispute split for:", {
        bookingId: booking._id,
        totalPrice: disputeAmount,
        decision: decision,
      });
    }

    const splits = calculateDisputeSplit(disputeAmount, decision);

    console.log("Calculated splits:", splits);

    dispute.status = "Resolved";
    dispute.adminDecision = decision;
    dispute.adminComment = comment;
    await dispute.save();
    console.log("Dispute saved");

    // ✅ Link dispute to booking
    booking.dispute = dispute._id;

    // ✅ Handle Heavy Duty Construction Milestone Disputes
    if (isHeavyDuty) {
      const currentMilestone = booking.paymentSchedule[currentMilestoneIndex];
      const isLastMilestone =
        currentMilestoneIndex === booking.paymentSchedule.length - 1;

      if (decision === "Release") {
        console.log(
          `Release Decision (Milestone ${currentMilestoneIndex + 1}): Paying contractor ${splits.contractorAmount}`,
        );

        // Mark this milestone as paid
        const releaseTime = new Date();
        const updatedSchedule = booking.paymentSchedule.map((m, idx) => {
          const obj = m.toObject ? m.toObject() : { ...m };
          if (idx === currentMilestoneIndex) {
            obj.status = "paid";
            obj.workflowState = "approved";
            obj.satisfactionDeadline = null;
            obj.releasedAt = releaseTime;
          }
          return obj;
        });
        booking.paymentSchedule = updatedSchedule;
        booking.markModified("paymentSchedule");

        // Pay contractor the milestone amount
        await Contractor.findByIdAndUpdate(booking.contractor._id, {
          $inc: { walletBalance: splits.contractorAmount },
        });

        // Check if this was the last milestone
        if (isLastMilestone) {
          booking.status = "Completed_And_Confirmed";
          booking.paymentStatus = "Completed";
          booking.userSatisfied = true;
          await booking.save();

          // Update contractor availability (job completely done)
          await updateContractorAvailability(booking.contractor._id);
        } else {
          // Move to next milestone
          booking.currentMilestone = currentMilestoneIndex + 1;
          booking.status = "Payment_Pending"; // Wait for next milestone payment
          booking.paymentExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

          const nextSchedule = booking.paymentSchedule.map((m, idx) => {
            const obj = m.toObject ? m.toObject() : { ...m };
            if (idx === currentMilestoneIndex + 1) {
              obj.workflowState = "pending_payment";
              obj.status = "pending";
              obj.milestoneStartDate = null;
              obj.milestoneDeadline = null;
              obj.completedAt = null;
              obj.satisfactionDeadline = null;
              obj.completionImages = [];
              obj.paymentScreenshot = null;
              obj.paymentVerifiedAt = null;
              obj.releasedAt = null;
              obj.autoReleasedAt = null;
            }
            return obj;
          });
          booking.paymentSchedule = nextSchedule;
          booking.markModified("paymentSchedule");
          await booking.save();
        }
      } else if (decision === "Refund") {
        console.log(
          `Refund Decision (Milestone ${currentMilestoneIndex + 1}): Refunding user ${splits.userAmount}`,
        );

        booking.status = "Cancelled";
        booking.paymentStatus = "Refunded";

        await User.findByIdAndUpdate(booking.user._id, {
          $inc: { walletBalance: splits.userAmount },
        });

        await booking.save();

        // Free up contractor availability (job cancelled)
        await updateContractorAvailability(booking.contractor._id);
      } else if (decision === "Split") {
        console.log(
          `Split Decision (Milestone ${currentMilestoneIndex + 1}): User gets ${splits.userAmount}, Contractor gets ${splits.contractorAmount}`,
        );

        // Mark milestone as paid (partial)
        const releaseTime = new Date();
        const updatedSchedule = booking.paymentSchedule.map((m, idx) => {
          const obj = m.toObject ? m.toObject() : { ...m };
          if (idx === currentMilestoneIndex) {
            obj.status = "paid";
            obj.workflowState = "approved";
            obj.satisfactionDeadline = null;
            obj.releasedAt = releaseTime;
          }
          return obj;
        });
        booking.paymentSchedule = updatedSchedule;
        booking.markModified("paymentSchedule");

        // Split payment
        await User.findByIdAndUpdate(booking.user._id, {
          $inc: { walletBalance: splits.userAmount },
        });

        await Contractor.findByIdAndUpdate(booking.contractor._id, {
          $inc: { walletBalance: splits.contractorAmount },
        });

        // Check if this was the last milestone
        if (isLastMilestone) {
          booking.status = "Completed_And_Confirmed";
          booking.paymentStatus = "Completed";
          await booking.save();

          // Update contractor availability (job completely done)
          await updateContractorAvailability(booking.contractor._id);
        } else {
          // Move to next milestone
          booking.currentMilestone = currentMilestoneIndex + 1;
          booking.status = "Payment_Pending";
          booking.paymentExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

          const nextSchedule = booking.paymentSchedule.map((m, idx) => {
            const obj = m.toObject ? m.toObject() : { ...m };
            if (idx === currentMilestoneIndex + 1) {
              obj.workflowState = "pending_payment";
              obj.status = "pending";
              obj.milestoneStartDate = null;
              obj.milestoneDeadline = null;
              obj.completedAt = null;
              obj.satisfactionDeadline = null;
              obj.completionImages = [];
              obj.paymentScreenshot = null;
              obj.paymentVerifiedAt = null;
              obj.releasedAt = null;
              obj.autoReleasedAt = null;
            }
            return obj;
          });
          booking.paymentSchedule = nextSchedule;
          booking.markModified("paymentSchedule");
          await booking.save();
        }
      }
    }
    // ✅ Handle Regular Booking Disputes
    else {
      if (decision === "Release") {
        console.log(
          `Release Decision: Paying contractor ${splits.contractorAmount}`,
        );
        booking.status = "Completed_And_Confirmed";
        booking.paymentStatus = "Completed";
        booking.userSatisfied = true;

        const contractorUpdate = await Contractor.findByIdAndUpdate(
          booking.contractor._id,
          { $inc: { walletBalance: splits.contractorAmount } },
          { new: true },
        );
        console.log("Contractor wallet updated:", {
          contractorId: booking.contractor._id,
          amount: splits.contractorAmount,
          newBalance: contractorUpdate?.walletBalance,
        });

        await booking.save();
      } else if (decision === "Refund") {
        console.log(`Refund Decision: Refunding user ${splits.userAmount}`);
        booking.status = "Cancelled";
        booking.paymentStatus = "Completed";

        const userUpdate = await User.findByIdAndUpdate(
          booking.user._id,
          { $inc: { walletBalance: splits.userAmount } },
          { new: true },
        );
        console.log("User wallet updated:", {
          userId: booking.user._id,
          amount: splits.userAmount,
          newBalance: userUpdate?.walletBalance,
        });

        await booking.save();
      } else if (decision === "Split") {
        console.log(
          `Split Decision: User gets ${splits.userAmount}, Contractor gets ${splits.contractorAmount}`,
        );
        booking.status = "Completed_And_Confirmed";
        booking.paymentStatus = "Completed";

        const userUpdate = await User.findByIdAndUpdate(
          booking.user._id,
          { $inc: { walletBalance: splits.userAmount } },
          { new: true },
        );
        console.log("User wallet updated:", {
          userId: booking.user._id,
          amount: splits.userAmount,
          newBalance: userUpdate?.walletBalance,
        });

        const contractorUpdate = await Contractor.findByIdAndUpdate(
          booking.contractor._id,
          { $inc: { walletBalance: splits.contractorAmount } },
          { new: true },
        );
        console.log("Contractor wallet updated:", {
          contractorId: booking.contractor._id,
          amount: splits.contractorAmount,
          newBalance: contractorUpdate?.walletBalance,
        });

        await booking.save();
      }
    }

    // ✅ NOTIFY both parties about dispute resolution
    const milestoneText = isHeavyDuty
      ? ` (Milestone ${currentMilestoneIndex + 1})`
      : "";

    await Notification.create({
      user: booking.user._id,
      message: `Dispute Resolved${milestoneText}: ${decision}. Check your wallet for settlement.`,
      type: "success",
      relatedBooking: booking._id,
      notifCategory: "dispute_resolved",
    });

    await Notification.create({
      user: booking.contractor._id,
      message: `Dispute Resolved${milestoneText}: ${decision}. Check your wallet for settlement.`,
      type: "success",
      relatedBooking: booking._id,
      notifCategory: "dispute_resolved",
    });

    console.log("✅ Dispute resolution complete");
    res.json({
      message: "Dispute Resolved Successfully",
      dispute: {
        id: dispute._id,
        status: dispute.status,
        decision: dispute.adminDecision,
        splits: splits,
        isHeavyDuty: isHeavyDuty,
        milestoneIndex: isHeavyDuty ? currentMilestoneIndex : null,
      },
    });
  } catch (error) {
    console.error("❌ Dispute Resolution Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDispute,
  submitDefense,
  getMyDisputes, // <--- EXPORTED THIS
  getDisputeDetails,
  summarizeDisputeAI,
  resolveDispute,
};
