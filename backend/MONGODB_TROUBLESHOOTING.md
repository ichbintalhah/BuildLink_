# MongoDB Connection Troubleshooting Guide

## Error Analysis

### Error: `MongoServerSelectionError: getaddrinfo ENOTFOUND`

**What it means:** MongoDB cannot resolve the hostname (DNS lookup failure)

**Root Causes:**

1. ❌ Invalid MongoDB Atlas hostname in `MONGO_URI`
2. ❌ Network connectivity issues (no internet or blocked DNS)
3. ❌ MongoDB Atlas cluster doesn't exist
4. ❌ IP whitelist not configured in MongoDB Atlas
5. ❌ Typo in the connection string

---

## Solution Steps

### Step 1: Verify `.env` File

Ensure your `.env` file in the `/backend` directory contains:

```env
MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/database_name?appName=Cluster0
```

**Common Issues:**

- [ ] Is the file named exactly `.env` (case-sensitive)?
- [ ] Is there a trailing newline or extra spaces?
- [ ] Is the username and password URL-encoded?

---

### Step 2: Validate MongoDB Atlas Cluster

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Log in with your credentials
3. Select your project and cluster
4. Check:
   - [ ] **Cluster Status**: Should show "Running" (green)
   - [ ] **Cluster Name**: Should match your connection string
   - [ ] **Cluster Tier**: Check if M0 (free tier) is still active

---

### Step 3: Configure IP Whitelist

1. In MongoDB Atlas, go to **Security** → **Network Access**
2. Click **+ Add IP Address**
3. Select one of:
   - **Allow access from anywhere** (for development: `0.0.0.0/0`)
   - **Add Current IP Address** (your computer's IP)
4. Click **Confirm**

**Note:** This can take 1-5 minutes to apply.

---

### Step 4: Verify Connection String Format

Valid MongoDB Atlas connection string:

```
mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/database_name?appName=Cluster0
```

**Check:**

- [ ] Username and password are URL-encoded (use [URL Encoder](https://www.urlencoder.org/))
  - Example: `@` becomes `%40`, `:` becomes `%3A`
- [ ] No spaces in the connection string
- [ ] Cluster name matches exactly
- [ ] Database name exists in MongoDB Atlas

---

### Step 5: Test Connection Manually

#### Option A: Using MongoDB Compass (GUI)

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Paste your connection string in the **URI** field
3. Click **Connect**
4. If it connects, the issue is with your Node.js setup

#### Option B: Using `mongosh` (CLI)

```bash
mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name"
```

If this works, your connection string is valid.

---

### Step 6: Check Node.js Backend

```bash
cd backend
npm install  # Reinstall dependencies
node server.js  # Start the server
```

**Expected Output:**

```
============================================================
🔍 Environment Configuration Check
============================================================
✅ PORT: 5000
✅ MONGO_URI: mongodb+src://...
✅ JWT_SECRET: ****...****
...
============================================================

============================================================
✅ MongoDB Connected: mongodb.net
   Database: buildlink_db
   Status: Connected & Ready
============================================================
```

---

## Common Connection Issues & Fixes

| Error                   | Cause                            | Solution                                      |
| ----------------------- | -------------------------------- | --------------------------------------------- |
| `ENOTFOUND`             | DNS can't resolve hostname       | Verify cluster name, check IP whitelist       |
| `ECONNREFUSED`          | Server rejected connection       | Check IP whitelist, ensure cluster is running |
| `ETIMEDOUT`             | Connection took too long         | Network issue or cluster overloaded           |
| `authentication failed` | Wrong username/password          | Verify credentials, check URL encoding        |
| `MongoParseError`       | Invalid connection string format | Use MongoDB Atlas URI exactly as provided     |

---

## Environment Configuration

The backend now validates all required environment variables on startup:

```
✅ MONGO_URI      - MongoDB connection string
✅ PORT           - Server port (default: 5000)
✅ JWT_SECRET     - JWT signing key
✅ GEMINI_API_KEY - Google Gemini API key
✅ CLOUDINARY_*   - Image hosting credentials
✅ EMAIL_*        - Email service credentials
```

If any variable is missing, the server will exit with detailed error messages.

---

## Enhanced Error Handling

The backend now includes:

1. **Retry Logic**: Automatically retries failed connections
2. **Connection Pooling**: Maintains 2-10 stable connections
3. **Detailed Logging**: Shows exact error cause with solutions
4. **Graceful Shutdown**: Properly closes connections on server stop
5. **Health Check Endpoint**: `/api/health` to monitor connection status

---

## Monitoring in Production

Once deployed, monitor these endpoints:

```bash
# Health check
curl https://your-api.com/api/health

# Expected response
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Getting Help

If you still have issues:

1. **Check MongoDB Atlas Status Page**: https://status.mongodb.com
2. **Review Server Logs**: Look for the detailed error diagnosis
3. **Verify Network**: `ping google.com` to test internet
4. **Test Locally First**: Use MongoDB Compass before running Node.js
5. **Clear and Restart**: Delete `node_modules`, reinstall, then start fresh

---

## Database Connection Features (New)

✅ **Auto-reconnect**: Automatically reconnects if connection drops
✅ **Connection pooling**: Maintains optimal number of connections
✅ **Timeout handling**: Prevents hanging connections
✅ **Error diagnosis**: Shows exact cause of failures
✅ **Graceful shutdown**: Proper cleanup on process termination
✅ **Health monitoring**: Built-in `/api/health` endpoint
