const express = require("express");
const router = express.Router();
const {
    getConversations,
    getConversation,
    startConversation,
    sendMessage,
    markAsRead,
    getUnreadCount,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Get all conversations for logged-in user
router.get("/", getConversations);

// Get unread message count
router.get("/unread/count", getUnreadCount);

// Start new conversation (customer only)
router.post("/start", startConversation);

// Get single conversation
router.get("/:conversationId", getConversation);

// Send message in conversation
router.post("/:conversationId/send", sendMessage);

// Mark conversation as read
router.put("/:conversationId/read", markAsRead);

module.exports = router;
