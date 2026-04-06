const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
    {
        ibanNumber: {
            type: String,
            default: "",
            trim: true,
        },
        bankName: {
            type: String,
            default: "",
            trim: true,
        },
        accountHolderName: {
            type: String,
            default: "",
            trim: true,
        },
        // Add more settings as needed in the future
        companyName: {
            type: String,
            default: "BuildLink",
            trim: true,
        },
        companyEmail: {
            type: String,
            default: "",
            trim: true,
        },
        companyPhone: {
            type: String,
            default: "",
            trim: true,
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
