const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Contractor = require("../models/Contractor");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// Validation: Check for phone numbers (7+ consecutive digits or written numbers)
const containsPhoneNumber = (text) => {
  if (!text) return false;

  // Check for 7 or more consecutive digits
  const digitPattern = /\d{7,}/;
  if (digitPattern.test(text)) {
    return true;
  }

  // Check for written phone numbers (common patterns)
  const writtenNumberPatterns = [
    /\b(zero|one|two|three|four|five|six|seven|eight|nine){7,}\b/gi,
    /\b\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d[\s\-\.]*\d/g,
    /(whatsapp|call|contact|phone|mobile|number|digits)[\s:]*\d+/gi,
    /(\+92|0092|03\d{2})/g, // Pakistan phone patterns
  ];

  return writtenNumberPatterns.some((pattern) => pattern.test(text));
};

// Validation: Check for email addresses
const containsEmail = (text) => {
  if (!text) return false;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return emailPattern.test(text);
};

// Create notification helper
const createNotification = async (
  userId,
  userType,
  message,
  conversationId,
) => {
  try {
    await Notification.create({
      user: userType === "User" ? userId : null,
      contractor: userType === "Contractor" ? userId : null,
      type: "message",
      message: message,
      relatedId: conversationId,
      notifCategory: "message",
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

// @desc    Get all conversations for logged-in user/contractor
// @route   GET /api/messages
// @access  Private
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const summaryOnly =
      String(req.query.summary || "").toLowerCase() === "true";

    let query = {};
    if (userRole === "contractor") {
      query.contractor = userId;
    } else {
      query.customer = userId;
    }

    let conversationsQuery = Message.find(query)
      .populate("customer", "fullName email profilePicture")
      .populate("contractor", "fullName email skill profilePicture")
      .sort({ lastMessageTime: -1 });

    if (summaryOnly) {
      conversationsQuery = conversationsQuery.select(
        "customer contractor projectType lastMessage lastMessageTime lastMessageSender unreadByCustomer unreadByContractor",
      );
    }

    const conversations = await conversationsQuery.lean();

    res.json(conversations);
  } catch (error) {
    console.error("Get Conversations Error:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// @desc    Get single conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const conversation = await Message.findById(conversationId)
      .populate("customer", "fullName email profilePicture")
      .populate("contractor", "fullName email skill profilePicture");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify user is part of this conversation
    const isParticipant =
      (userRole === "contractor" &&
        conversation.contractor._id.toString() === userId.toString()) ||
      (userRole !== "contractor" &&
        conversation.customer._id.toString() === userId.toString());

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Mark messages as read
    if (userRole === "contractor") {
      conversation.messages.forEach((msg) => {
        if (msg.sender === "customer" && !msg.isRead) {
          msg.isRead = true;
        }
      });
      conversation.unreadByContractor = 0;
    } else {
      conversation.messages.forEach((msg) => {
        if (msg.sender === "contractor" && !msg.isRead) {
          msg.isRead = true;
        }
      });
      conversation.unreadByCustomer = 0;
    }

    await conversation.save();

    res.json(conversation);
  } catch (error) {
    console.error("Get Conversation Error:", error);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
};

// @desc    Start new conversation or get existing
// @route   POST /api/messages/start
// @access  Private (Customer only)
const startConversation = async (req, res) => {
  try {
    const { contractorId, customerId, projectType, initialMessage } = req.body;
    const userRole = req.user.role;

    // Determine customer and contractor based on who initiated
    let finalCustomerId, finalContractorId;

    if (userRole === "contractor") {
      // Contractor initiating conversation
      finalContractorId = req.user._id;
      finalCustomerId = customerId;

      if (!customerId || !projectType) {
        return res
          .status(400)
          .json({ message: "Customer and project type are required" });
      }
    } else {
      // Customer initiating conversation
      finalCustomerId = req.user._id;
      finalContractorId = contractorId;

      if (!contractorId || !projectType) {
        return res
          .status(400)
          .json({ message: "Contractor and project type are required" });
      }
    }

    // Check if conversation already exists
    let conversation = await Message.findOne({
      customer: finalCustomerId,
      contractor: finalContractorId,
    })
      .populate("customer", "fullName email profilePicture")
      .populate("contractor", "fullName email skill profilePicture");

    if (conversation) {
      return res.json(conversation);
    }

    // Verify contractor and customer exist
    const contractor = await Contractor.findById(finalContractorId);
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }

    const customer = await User.findById(finalCustomerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Create new conversation
    const senderType = userRole === "contractor" ? "contractor" : "customer";

    conversation = await Message.create({
      customer: finalCustomerId,
      contractor: finalContractorId,
      projectType,
      messages: initialMessage
        ? [
            {
              sender: senderType,
              senderName: req.user.fullName,
              text: initialMessage,
              timestamp: new Date(),
            },
          ]
        : [],
      lastMessage: initialMessage || "",
      lastMessageTime: new Date(),
      lastMessageSender: senderType,
      unreadByContractor: senderType === "customer" && initialMessage ? 1 : 0,
      unreadByCustomer: senderType === "contractor" && initialMessage ? 1 : 0,
    });

    conversation = await conversation.populate(
      "customer",
      "fullName email profilePicture",
    );
    conversation = await conversation.populate(
      "contractor",
      "fullName email skill profilePicture",
    );

    // Create notification for the recipient
    if (initialMessage) {
      if (userRole === "contractor") {
        await createNotification(
          finalCustomerId,
          "User",
          `New message from contractor ${req.user.fullName} about ${projectType}`,
          conversation._id,
        );
      } else {
        await createNotification(
          finalContractorId,
          "Contractor",
          `New message from ${req.user.fullName} about ${projectType}`,
          conversation._id,
        );
      }
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Start Conversation Error:", error);
    res.status(500).json({ message: "Failed to start conversation" });
  }
};

// @desc    Send message in conversation
// @route   POST /api/messages/:conversationId/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, image } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!text && !image) {
      return res
        .status(400)
        .json({ message: "Message text or image is required" });
    }

    // Validate text for phone numbers and emails
    if (text) {
      if (containsPhoneNumber(text)) {
        return res.status(400).json({
          message:
            "Phone numbers are not allowed. Please use the booking system to share contact details after payment.",
        });
      }

      if (containsEmail(text)) {
        return res.status(400).json({
          message:
            "Email addresses are not allowed. Please use the platform's messaging system.",
        });
      }
    }

    const conversation = await Message.findById(conversationId)
      .populate("customer", "fullName email profilePicture")
      .populate("contractor", "fullName email skill profilePicture");

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify user is part of this conversation
    const senderType = userRole === "contractor" ? "contractor" : "customer";
    const isParticipant =
      (senderType === "contractor" &&
        conversation.contractor._id.toString() === userId.toString()) ||
      (senderType === "customer" &&
        conversation.customer._id.toString() === userId.toString());

    if (!isParticipant) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Handle image upload if provided
    let imageUrl = null;
    if (image) {
      try {
        // Image should be base64 string from frontend
        imageUrl = await uploadToCloudinary(image, "messages");
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload image" });
      }
    }

    // Create new message
    const newMessage = {
      sender: senderType,
      senderName: req.user.fullName,
      text: text || "",
      image: imageUrl,
      timestamp: new Date(),
      isRead: false,
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = text || "📷 Image";
    conversation.lastMessageTime = new Date();
    conversation.lastMessageSender = senderType;

    // Update unread count (ensure fields exist for old documents)
    if (senderType === "contractor") {
      conversation.unreadByCustomer = (conversation.unreadByCustomer || 0) + 1;
    } else {
      conversation.unreadByContractor =
        (conversation.unreadByContractor || 0) + 1;
    }

    await conversation.save();

    // Create notification for recipient
    const recipientId =
      senderType === "contractor"
        ? conversation.customer._id
        : conversation.contractor._id;
    const recipientType = senderType === "contractor" ? "User" : "Contractor";
    const notificationMessage = `New message from ${req.user.fullName}: ${
      text ? text.substring(0, 50) : "sent an image"
    }`;

    await createNotification(
      recipientId,
      recipientType,
      notificationMessage,
      conversation._id,
    );

    res.json({
      message: "Message sent successfully",
      conversation,
      newMessage: conversation.messages[conversation.messages.length - 1],
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/messages/:conversationId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const conversation = await Message.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Update read status
    if (userRole === "contractor") {
      conversation.messages.forEach((msg) => {
        if (msg.sender === "customer") {
          msg.isRead = true;
        }
      });
      conversation.unreadByContractor = 0;
    } else {
      conversation.messages.forEach((msg) => {
        if (msg.sender === "contractor") {
          msg.isRead = true;
        }
      });
      conversation.unreadByCustomer = 0;
    }

    await conversation.save();

    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error("Mark as Read Error:", error);
    res.status(500).json({ message: "Failed to mark as read" });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === "contractor") {
      query = { contractor: userId, unreadByContractor: { $gt: 0 } };
    } else {
      query = { customer: userId, unreadByCustomer: { $gt: 0 } };
    }

    const unreadCount = await Message.countDocuments(query);

    res.json({ unreadCount });
  } catch (error) {
    console.error("Get Unread Count Error:", error);
    res.status(500).json({ message: "Failed to get unread count" });
  }
};

module.exports = {
  getConversations,
  getConversation,
  startConversation,
  sendMessage,
  markAsRead,
  getUnreadCount,
};
