# Heavy Duty Construction Messaging System

## ✅ Implementation Complete

### Backend Components

#### 1. Message Model (`backend/models/Message.js`)

- Stores conversations between customers and contractors
- Schema fields:
  - `customer` - Reference to User model
  - `contractor` - Reference to Contractor model
  - `projectType` - Type of heavy duty construction service
  - `messages[]` - Array of message objects with:
    - `sender` - "customer" or "contractor"
    - `text` - Message content
    - `image` - Cloudinary URL for uploaded images
    - `timestamp` - Message timestamp
    - `isRead` - Read status
  - `unreadByCustomer` - Count of unread messages for customer
  - `unreadByContractor` - Count of unread messages for contractor
- Indexed for performance on customer+contractor pairs

#### 2. Message Controller (`backend/controllers/messageController.js`)

**Validation Functions:**

- `containsPhoneNumber()` - Detects:
  - 7+ consecutive digits (1234567)
  - Written numbers (zero one two three...)
  - Pakistan patterns (+92, 0092, 03xx)
  - Phone keywords (call me, contact, whatsapp)
- `containsEmail()` - Detects email patterns

**API Functions:**

- `getConversations()` - Get all conversations for logged-in user
- `getConversation()` - Get specific conversation with all messages
- `startConversation()` - Start new conversation with contractor
- `sendMessage()` - Send message with validation and image upload
- `markAsRead()` - Mark conversation messages as read
- `getUnreadCount()` - Get unread message count

#### 3. Message Routes (`backend/routes/messageRoutes.js`)

All routes protected with authentication middleware:

```
GET    /api/messages              - Get all conversations
GET    /api/messages/unread/count - Get unread count
POST   /api/messages/start        - Start new conversation
GET    /api/messages/:conversationId - Get specific conversation
POST   /api/messages/:conversationId/send - Send message
PUT    /api/messages/:conversationId/read - Mark as read
```

#### 4. Server Configuration

- Routes registered at `/api/messages` in `server.js`
- Integrated with existing authentication system
- Uses Cloudinary for image uploads

### Frontend Components

#### 1. Contractor Messages Page (`frontend/src/pages/ContractorMessages.jsx`)

**Features:**

- Dedicated "Messages" tab in contractor dashboard
- Two-column layout:
  - Left: Conversation list with unread badges
  - Right: Chat interface with message history
- Real-time polling (fetch every 5 seconds)
- Image upload support (max 5MB)
- Image preview before sending
- Auto-scroll to new messages
- Mark as read on conversation selection
- Error handling with toast notifications

**State Management:**

- `conversations` - All conversations
- `selectedConversation` - Currently active chat
- `loading` - Loading state
- `sending` - Sending message state
- `selectedImage` - File to upload
- `imagePreview` - Base64 preview

#### 2. Heavy Duty Booking Modal (`frontend/src/components/HeavyDutyBookingModal.jsx`)

**Features:**

- Tab navigation: "Booking Form" vs "Chat"
- Integrated messaging within booking flow
- Auto-start conversation when opening chat tab
- Image upload support
- Conversation ID linked to booking
- Messages included in booking submission

**New State:**

- `conversationId` - Current conversation ID
- `sendingMessage` - Message sending state
- `selectedImage` - Image file
- `imagePreview` - Image preview URL

### Validation Rules

**Phone Number Detection:**

1. **Consecutive Digits:** Any sequence of 7+ digits
   - Example: "1234567", "03001234567"
2. **Written Numbers:** Spelled-out numbers
   - Example: "zero three three two one five"
3. **Pakistan Patterns:**
   - `+92` prefix
   - `0092` prefix
   - Mobile patterns: `03XX`
4. **Phone Keywords:**
   - "call me"
   - "contact"
   - "whatsapp"
   - "mobile"
   - "number"

**Email Detection:**

- Standard email pattern matching
- Example: "user@example.com"

**Image Upload:**

- Max size: 5MB
- Formats: image/\* (jpg, png, gif, etc.)
- Uploaded to Cloudinary
- Stored as URL in database

### Notification System

**When Message Sent:**

1. Creates notification in database
2. Recipients:
   - Customer receives notification when contractor replies
   - Contractor receives notification in dashboard "Messages" tab
3. Unread counters increment automatically
4. Badge shows unread count in conversation list

### Testing Checklist

#### Backend Testing

- [ ] Start server: `cd backend && npm start`
- [ ] Verify MongoDB connection
- [ ] Check routes registered at `/api/messages`

#### Frontend Testing - Contractor Dashboard

1. [ ] Login as contractor
2. [ ] Navigate to "Messages" tab
3. [ ] See empty state if no messages
4. [ ] Wait for real customer messages

#### Frontend Testing - Customer Booking

1. [ ] Navigate to Heavy Duty Construction page
2. [ ] Select service and click contractor
3. [ ] Open booking modal
4. [ ] Switch to "Chat" tab
5. [ ] Test sending text message
6. [ ] Test uploading image (under 5MB)
7. [ ] Try sending phone number (should fail):
   - "Call me at 1234567"
   - "My number is zero three zero zero"
   - "+923001234567"
8. [ ] Try sending email (should fail):
   - "Email me at test@example.com"
9. [ ] Submit booking with messages
10. [ ] Check contractor receives messages

#### Error Scenarios

- [ ] Send message without text or image (button disabled)
- [ ] Upload image over 5MB (error toast)
- [ ] Send phone number (validation error)
- [ ] Send email (validation error)
- [ ] Network error handling

### API Integration Notes

**Starting Conversation:**

```javascript
POST /api/messages/start
Body: {
  contractorId: "contractor_mongodb_id",
  projectType: "Building Foundation & Basement"
}
Response: {
  conversation: { _id, customer, contractor, messages, ... }
}
```

**Sending Message:**

```javascript
POST /api/messages/:conversationId/send
Body: {
  text: "Message text",
  image: "data:image/jpeg;base64,..." // optional
}
Response: {
  conversation: { updated conversation object }
}
```

**Image Upload:**

- Frontend converts file to base64
- Backend receives base64 string
- Backend uploads to Cloudinary
- Returns Cloudinary URL
- URL stored in message.image field

### File Locations

**Backend:**

- `backend/models/Message.js`
- `backend/controllers/messageController.js`
- `backend/routes/messageRoutes.js`
- `backend/server.js` (routes registered)

**Frontend:**

- `frontend/src/pages/ContractorMessages.jsx`
- `frontend/src/components/HeavyDutyBookingModal.jsx`
- `frontend/src/components/DashboardLayout.jsx` (Messages tab added)
- `frontend/src/pages/Dashboard.jsx` (routing updated)

### Next Steps

1. **Test with Real Data:**
   - Create test contractor account
   - Create test customer account
   - Send test messages
   - Verify notifications

2. **Optional Enhancements:**
   - Real-time updates with Socket.IO
   - Message search/filter
   - Delete conversation
   - Block user
   - Message reactions
   - Audio messages
   - File attachments (PDFs, etc.)

3. **Production Considerations:**
   - Rate limiting on message sending
   - Spam detection
   - Message history pagination
   - Archive old conversations
   - Customer support integration

## Usage Example

**Customer Flow:**

1. Browse Heavy Duty Construction services
2. Select contractor
3. Open booking modal
4. Switch to Chat tab (auto-creates conversation)
5. Ask questions: "What materials do you use?"
6. Upload reference image
7. Negotiate budget/timeline
8. Switch to Booking Form
9. Submit booking with conversation linked

**Contractor Flow:**

1. Login to dashboard
2. Click "Messages" tab
3. See list of conversations with unread badges
4. Click conversation to open
5. Read customer messages (auto-marks as read)
6. Reply with text and/or images
7. Customer receives notification
8. Continue negotiation until booking confirmed

## Security Features

✅ Phone number validation (multiple patterns)
✅ Email validation
✅ Image size limit (5MB)
✅ Authentication required for all routes
✅ User can only see their own conversations
✅ Cloudinary secure image upload
✅ Input sanitization in backend
✅ XSS prevention with React
