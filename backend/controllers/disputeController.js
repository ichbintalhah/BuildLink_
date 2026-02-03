const Dispute = require("../models/Dispute");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Contractor = require("../models/Contractor");
const Notification = require("../models/Notification");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Create Dispute (User)
const createDispute = async (req, res) => {
    try {
        const { bookingId, reason, userEvidence } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        const existing = await Dispute.findOne({ booking: bookingId });
        if (existing) return res.status(400).json({ message: "Dispute already active." });

        const dispute = await Dispute.create({
            booking: bookingId,
            initiator: req.user._id,
            reason,
            userEvidence: userEvidence || [],
            status: "Open"
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
        }));
        if (adminNotifications.length > 0) {
            await Notification.insertMany(adminNotifications);
        }

        // ✅ NOTIFY CONTRACTOR about dispute
        await Notification.create({
            user: booking.contractor,
            message: `Dispute opened on your job: ${booking.serviceName}. Please submit your defense.`,
            type: "alert",
            relatedBooking: booking._id,
        });

        console.log("✅ Dispute created and notifications sent", {
            disputeId: dispute._id,
            bookingId: booking._id,
            contractorId: booking.contractor
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
            { contractorDefense: defense, contractorEvidence: evidence || [] },
            { new: true }
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
        }));
        if (adminNotifications.length > 0) {
            await Notification.insertMany(adminNotifications);
        }

        console.log("✅ Defense submitted and admins notified", {
            disputeId: dispute._id,
            contractorId: req.user._id
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
                select: "serviceName totalPrice"
            })
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
                    { path: "user", select: "fullName email" },
                    { path: "contractor", select: "fullName email contractorDetails" }
                ]
            });

        if (!dispute) return res.status(404).json({ message: "Dispute not found" });

        const splitScreenData = {
            userSide: {
                name: dispute.booking.user.fullName,
                claim: dispute.reason,
                evidence: dispute.userEvidence
            },
            contractorSide: {
                name: dispute.booking.contractor.fullName,
                defense: dispute.contractorDefense || "Pending defense...",
                evidence: dispute.contractorEvidence || [],
                workImages: dispute.booking.completionImages
            },
            aiSummary: dispute.aiAnalysis || null
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

        console.log("🤖 Starting AI Summary for dispute:", req.params.id);

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
CONTRACTOR DEFENSE: "${dispute.contractorDefense || 'No defense submitted yet'}"

Please provide:
1. Brief summary of the dispute
2. Analysis of both parties' positions
3. Key considerations
4. Fair recommendation for resolution

Keep your response clear, balanced, and professional.
        `;

        console.log("🚀 Sending request to Gemini API...");
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
            analysis: text
        });
    } catch (error) {
        console.error("❌ AI Summarize Error:", error);
        console.error("Error details:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to generate AI analysis. Please try again.",
            error: error.message
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
            return res.status(400).json({ message: "Invalid decision. Must be 'Release', 'Refund', or 'Split'" });
        }

        const dispute = await Dispute.findById(req.params.id);
        if (!dispute) return res.status(404).json({ message: "Dispute not found" });

        const booking = await Booking.findById(dispute.booking).populate("user contractor");
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        console.log("💰 Calculating dispute split for:", {
            bookingId: booking._id,
            totalPrice: booking.totalPrice,
            decision: decision
        });

        const splits = calculateDisputeSplit(booking.totalPrice, decision);

        console.log("✅ Calculated splits:", splits);

        dispute.status = "Resolved";
        dispute.adminDecision = decision;
        dispute.adminComment = comment;
        await dispute.save();
        console.log("📝 Dispute saved");

        // ✅ Link dispute to booking
        booking.dispute = dispute._id;

        // ✅ Update wallet balances BEFORE saving booking
        if (decision === "Release") {
            console.log(`💸 Release Decision: Paying contractor ${splits.contractorAmount}`);
            booking.status = "Completed_And_Confirmed";
            booking.paymentStatus = "Completed";
            booking.userSatisfied = true;

            const contractorUpdate = await Contractor.findByIdAndUpdate(
                booking.contractor._id,
                { $inc: { walletBalance: splits.contractorAmount } },
                { new: true }
            );
            console.log("✅ Contractor wallet updated:", {
                contractorId: booking.contractor._id,
                amount: splits.contractorAmount,
                newBalance: contractorUpdate?.walletBalance
            });

            await booking.save();
        } else if (decision === "Refund") {
            console.log(`💸 Refund Decision: Refunding user ${splits.userAmount}`);
            booking.status = "Cancelled";
            booking.paymentStatus = "Completed";

            const userUpdate = await User.findByIdAndUpdate(
                booking.user._id,
                { $inc: { walletBalance: splits.userAmount } },
                { new: true }
            );
            console.log("✅ User wallet updated:", {
                userId: booking.user._id,
                amount: splits.userAmount,
                newBalance: userUpdate?.walletBalance
            });

            await booking.save();
        } else if (decision === "Split") {
            console.log(`💸 Split Decision: User gets ${splits.userAmount}, Contractor gets ${splits.contractorAmount}`);
            booking.status = "Completed_And_Confirmed";
            booking.paymentStatus = "Completed";

            const userUpdate = await User.findByIdAndUpdate(
                booking.user._id,
                { $inc: { walletBalance: splits.userAmount } },
                { new: true }
            );
            console.log("✅ User wallet updated:", {
                userId: booking.user._id,
                amount: splits.userAmount,
                newBalance: userUpdate?.walletBalance
            });

            const contractorUpdate = await Contractor.findByIdAndUpdate(
                booking.contractor._id,
                { $inc: { walletBalance: splits.contractorAmount } },
                { new: true }
            );
            console.log("✅ Contractor wallet updated:", {
                contractorId: booking.contractor._id,
                amount: splits.contractorAmount,
                newBalance: contractorUpdate?.walletBalance
            });

            await booking.save();
        }

        // ✅ NOTIFY both parties about dispute resolution
        await Notification.create({
            user: booking.user._id,
            message: `Dispute Resolved: ${decision}. Check your wallet for settlement.`,
            type: "success",
            relatedBooking: booking._id,
        });

        await Notification.create({
            user: booking.contractor._id,
            message: `Dispute Resolved: ${decision}. Check your wallet for settlement.`,
            type: "success",
            relatedBooking: booking._id,
        });

        console.log("✅ Dispute resolution complete");
        res.json({
            message: "Dispute Resolved Successfully",
            dispute: {
                id: dispute._id,
                status: dispute.status,
                decision: dispute.adminDecision,
                splits: splits
            }
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
    resolveDispute
};