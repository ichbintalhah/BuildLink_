const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "userModel", // allows User or Contractor
            required: true,
        },
        userModel: {
            type: String,
            enum: ["User", "Contractor"],
            default: "User",
        },
        amount: {
            type: Number,
            required: true,
        },
        method: {
            type: String, // e.g., "EasyPaisa", "JazzCash"
            required: true,
        },
        accountDetails: {
            type: String, // e.g., "0300-1234567"
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Completed", "Rejected"],
            default: "Pending",
        },
        transactionScreenshot: {
            type: String, // Admin uploads this proof when completing
        },
        processedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);