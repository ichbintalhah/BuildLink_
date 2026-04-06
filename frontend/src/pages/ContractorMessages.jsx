import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, Send, Mail, Image as ImageIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import ChatAvatar from "../components/ChatAvatar";
import PageLoader from "../components/PageLoader";

const ContractorMessages = () => {
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [validationError, setValidationError] = useState("");
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch conversations
  const fetchConversations = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const { data } = await api.get("/messages");
      setConversations(data);
      return data; // Return for auto-selection
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      if (showLoading) toast.error("Failed to load messages");
      return [];
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
    // Poll for new messages every 10 seconds without showing loading
    const interval = setInterval(() => fetchConversations(false), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedConversation?._id) return;

    const refreshedConversation = conversations.find(
      (conversation) => conversation._id === selectedConversation._id,
    );

    if (refreshedConversation) {
      setSelectedConversation((previous) =>
        previous &&
        previous._id === refreshedConversation._id &&
        previous.lastMessageTime === refreshedConversation.lastMessageTime &&
        (previous.messages || []).length ===
          (refreshedConversation.messages || []).length &&
        previous.customer?.profilePicture ===
          refreshedConversation.customer?.profilePicture &&
        previous.contractor?.profilePicture ===
          refreshedConversation.contractor?.profilePicture
          ? previous
          : refreshedConversation,
      );
    }
  }, [conversations, selectedConversation?._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?._id, selectedConversation?.messages?.length]);

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);

    // Mark as read
    try {
      await api.put(`/messages/${conversation._id}/read`);
      // Update local state
      setConversations(
        conversations.map((c) =>
          c._id === conversation._id ? { ...c, unreadByContractor: 0 } : c,
        ),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Auto-select conversation from negotiate button navigation
  useEffect(() => {
    if (
      location.state?.selectConversationId &&
      conversations.length > 0 &&
      !selectedConversation
    ) {
      const targetConvo = conversations.find(
        (c) => c._id === location.state.selectConversationId,
      );
      if (targetConvo) {
        setSelectedConversation(targetConvo);
        // Mark as read
        api
          .put(`/messages/${targetConvo._id}/read`)
          .catch((err) => console.error(err));
      }
    }
  }, [conversations, location.state, selectedConversation]);

  // Handle Reply to User Message
  const handleSendReply = async () => {
    if ((!replyMessage.trim() && !selectedImage) || !selectedConversation)
      return;

    // Validation: Check for 8 consecutive numbers
    const hasEightConsecutiveNumbers = /\d{8,}/.test(replyMessage);
    if (hasEightConsecutiveNumbers) {
      setValidationError(
        "🚫 Cannot share phone numbers! Please use BuildLink's chat for all communications.",
      );
      return;
    }

    // Validation: Check for restricted keywords
    const restrictedKeywords = [
      "call",
      "sms",
      "phone",
      "number",
      "whatsapp",
      "message",
      "contact",
      "mobile",
      "cell",
    ];
    const lowerMessage = replyMessage.toLowerCase();
    const foundKeyword = restrictedKeywords.find((keyword) =>
      lowerMessage.includes(keyword),
    );

    if (foundKeyword) {
      setValidationError(
        `🚫 Cannot share contact information! The word "${foundKeyword}" is not allowed. Please communicate only through BuildLink chat.`,
      );
      return;
    }

    setValidationError("");
    setSending(true);
    try {
      const payload = {
        text: replyMessage.trim(),
      };

      // Convert image to base64 if selected
      if (selectedImage) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onloadend = async () => {
          payload.image = reader.result;
          await sendMessageToAPI(payload);
        };
      } else {
        await sendMessageToAPI(payload);
      }
    } catch (error) {
      console.error("Send message error:", error);
      setValidationError(
        error.response?.data?.message || "Failed to send message",
      );
      setSending(false);
    }
  };

  const sendMessageToAPI = async (payload) => {
    try {
      const { data } = await api.post(
        `/messages/${selectedConversation._id}/send`,
        payload,
      );

      // Backend returns { conversation, newMessage } so extract conversation
      const updatedConversation = data.conversation || data;

      // Update conversations list
      setConversations(
        conversations.map((c) =>
          c._id === selectedConversation._id ? updatedConversation : c,
        ),
      );

      // Update selected conversation
      setSelectedConversation(updatedConversation);

      setReplyMessage("");
      removeImage();
      toast.success("Message sent!");
    } catch (error) {
      throw error;
    } finally {
      setSending(false);
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const unreadCount = conversations.filter(
    (c) => c.unreadByContractor > 0,
  ).length;

  if (loading) {
    return <PageLoader isLoading={true} message="Loading messages..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageCircle size={32} className="text-primary" />
            Customer Messages
          </h1>
          <p className="opacity-60 mt-1">
            View and respond to customer inquiries
          </p>
        </div>
        {unreadCount > 0 && (
          <div className="badge badge-error badge-lg gap-2 animate-pulse">
            <Mail size={16} />
            {unreadCount} New Message{unreadCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* MESSAGES INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-base-100 rounded-2xl shadow-xl border-2 border-base-300 overflow-hidden min-h-[650px]">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-base-200/50 p-4 space-y-2 max-h-[650px] overflow-y-auto">
          <h3 className="font-bold text-sm uppercase opacity-60 mb-3 flex items-center gap-2">
            <Mail size={14} />
            Conversations ({conversations.length})
          </h3>
          {conversations.map((conv) => {
            const lastMsg =
              conv.messages && conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1]
                : null;
            return (
              <div
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedConversation?._id === conv._id
                    ? "bg-primary text-white shadow-md scale-105"
                    : conv.unreadByContractor > 0
                      ? "bg-warning/10 border-2 border-warning/30 hover:bg-warning/20"
                      : "bg-base-100 hover:bg-base-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-3">
                  <ChatAvatar
                    imageUrl={conv.customer?.profilePicture}
                    name={
                      conv.customer?.fullName ||
                      conv.customer?.name ||
                      "Unknown User"
                    }
                    sizeClass="h-12 w-12"
                    textClass="text-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm truncate">
                        {conv.customer?.fullName ||
                          conv.customer?.name ||
                          "Unknown User"}
                      </h4>
                      {conv.unreadByContractor > 0 &&
                        selectedConversation?._id !== conv._id && (
                          <span className="badge badge-error badge-xs animate-pulse">
                            {conv.unreadByContractor}
                          </span>
                        )}
                    </div>
                    <p className="text-xs opacity-70 mb-1 font-semibold truncate">
                      {conv.projectType || "Heavy Duty Construction"}
                    </p>
                    <p className="text-xs opacity-80 truncate">
                      {lastMsg?.text || "No messages yet"}
                    </p>
                    <p className="text-xs opacity-50 mt-1">
                      {lastMsg
                        ? new Date(lastMsg.timestamp).toLocaleString()
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {conversations.length === 0 && (
            <div className="text-center py-12 opacity-50">
              <MessageCircle size={32} className="mx-auto mb-2" />
              <p className="text-sm">No messages yet</p>
            </div>
          )}
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-primary to-secondary text-white p-5 border-b border-base-300 shadow-lg">
                <div className="flex items-center gap-3">
                  <ChatAvatar
                    imageUrl={selectedConversation.customer?.profilePicture}
                    name={
                      selectedConversation.customer?.fullName ||
                      selectedConversation.customer?.name ||
                      "Unknown User"
                    }
                    sizeClass="h-14 w-14"
                    textClass="text-base"
                    frameClass="border-white/70"
                  />
                  <div>
                    <h3 className="font-bold text-xl">
                      {selectedConversation.customer?.fullName ||
                        selectedConversation.customer?.name ||
                        "Unknown User"}
                    </h3>
                    <p className="text-sm opacity-90 flex items-center gap-1">
                      <MessageCircle size={14} />
                      {selectedConversation.projectType ||
                        "Heavy Duty Construction"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gradient-to-b from-base-100 to-base-200/30 max-h-[500px]">
                {(selectedConversation.messages || []).map((msg, index) => {
                  const isCustomerMessage = msg.sender === "customer";
                  const senderName = isCustomerMessage
                    ? selectedConversation.customer?.fullName ||
                      selectedConversation.customer?.name ||
                      "Customer"
                    : "You";
                  const senderAvatarUrl = isCustomerMessage
                    ? selectedConversation.customer?.profilePicture
                    : selectedConversation.contractor?.profilePicture;

                  return (
                    <div
                      key={msg._id || `msg-${index}`}
                      className={`chat ${isCustomerMessage ? "chat-start" : "chat-end"}`}
                    >
                      <div className="chat-image">
                        <ChatAvatar
                          imageUrl={senderAvatarUrl}
                          name={senderName}
                          sizeClass="h-10 w-10 sm:h-11 sm:w-11"
                          textClass="text-xs sm:text-sm"
                        />
                      </div>
                      <div className="chat-header text-xs opacity-70 mb-1">
                        {senderName}
                      </div>
                      <div
                        className={`chat-bubble ${
                          isCustomerMessage
                            ? "chat-bubble-primary"
                            : "chat-bubble-success"
                        } shadow-lg`}
                      >
                        {msg.text}
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="Attachment"
                            className="mt-2 rounded-lg max-w-xs cursor-pointer hover:opacity-90"
                            onClick={() => window.open(msg.image, "_blank")}
                          />
                        )}
                      </div>
                      <div className="chat-footer text-xs opacity-50 mt-1">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-5 bg-gradient-to-r from-base-200 to-base-300 border-t-2 border-base-300 shadow-lg">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-24 rounded-lg border-2 border-primary"
                    />
                    <button
                      onClick={removeImage}
                      className="btn btn-circle btn-xs btn-error absolute -top-2 -right-2"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-square btn-outline btn-primary"
                    title="Attach image"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={(e) => {
                      const value = e.target.value;
                      setReplyMessage(value);

                      // Real-time validation feedback
                      const restrictedWords = [
                        "call",
                        "sms",
                        "phone",
                        "number",
                        "whatsapp",
                        "message",
                        "contact",
                        "mobile",
                        "cell",
                      ];
                      const lower = value.toLowerCase();
                      const found = restrictedWords.find((w) =>
                        lower.includes(w),
                      );

                      if (/\d{8,}/.test(value)) {
                        setValidationError(
                          "⚠️ Phone numbers are not allowed in chat!",
                        );
                      } else if (found) {
                        setValidationError(
                          `⚠️ The word "${found}" is not allowed. Sharing contact info is restricted.`,
                        );
                      } else {
                        setValidationError("");
                      }
                    }}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !sending && handleSendReply()
                    }
                    placeholder="Type your reply..."
                    className={`input input-bordered flex-1 focus:ring-2 focus:ring-primary shadow-sm ${
                      validationError ? "border-error" : ""
                    }`}
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={
                      (!replyMessage.trim() && !selectedImage) || sending
                    }
                    className="btn btn-primary gap-2 shadow-lg hover:scale-105 transition-transform"
                  >
                    {sending ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <Send size={18} />
                    )}
                    Send
                  </button>
                </div>
                {validationError && (
                  <p className="text-error text-sm font-semibold mt-2 flex items-center gap-2 animate-pulse">
                    {validationError}
                  </p>
                )}
                <p className="text-xs opacity-60 mt-2 flex items-center gap-2">
                  <span>💡</span>
                  <span>
                    Press <kbd className="kbd kbd-xs">Enter</kbd> to send •
                    Customer will receive notification • No phone numbers or
                    contact info allowed
                  </span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-50">
              <MessageCircle size={80} className="mb-4 text-base-300" />
              <h3 className="text-xl font-bold mb-2">Select a conversation</h3>
              <p className="text-sm">
                Choose a message from the list to view and reply
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorMessages;
