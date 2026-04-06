const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        // Conversation participants
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        contractor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contractor",
            required: true,
            index: true,
        },

        // Related booking (if message is from booking modal)
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
        },

        // Project details
        projectType: {
            type: String,
            required: true,
        },

        // Individual messages in the conversation
        messages: [
            {
                sender: {
                    type: String,
                    enum: ["customer", "contractor"],
                    required: true,
                },
                senderName: {
                    type: String,
                    required: true,
                },
                text: {
                    type: String,
                    maxlength: 1000,
                },
                image: {
                    type: String, // Cloudinary URL
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                isRead: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        // Last message info for quick display
        lastMessage: {
            type: String,
            default: "",
        },
        lastMessageTime: {
            type: Date,
            default: Date.now,
        },
        lastMessageSender: {
            type: String,
            enum: ["customer", "contractor"],
        },

        // Unread counts for each participant
        unreadByCustomer: {
            type: Number,
            default: 0,
        },
        unreadByContractor: {
            type: Number,
            default: 0,
        },

        // Conversation status
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient querying
messageSchema.index({ customer: 1, contractor: 1 });
messageSchema.index({ contractor: 1, unreadByContractor: 1 });
messageSchema.index({ customer: 1, unreadByCustomer: 1 });

module.exports = mongoose.model("Message", messageSchema);
