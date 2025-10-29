# ⚠️ Port 5000 Conflict Issue

## Problem
Port 5000 is already in use by **Apple's AirPlay/AirTunes service** on macOS. This prevents the Node.js server from starting.

## Quick Fix

**Update your `.env` file to use port 5001:**

```bash
cd /Users/brandonleskanic/code/openai/server

# Option 1: Edit manually
open .env

# Option 2: Use sed to update (recommended)
sed -i '' 's/PORT=5000/PORT=5001/g' .env
```

**Then restart the server.**

---

## Alternative: Disable Apple's AirPlay Receiver

If you prefer to keep using port 5000:

1. **System Settings** → **General** → **AirDrop & Handoff**
2. Turn off **"AirPlay Receiver"**
3. Restart your terminal

---

## Verification

After updating the port, verify the server is working:

```bash
# Check if port 5001 is listening
lsof -ti:5001

# Test the API
curl http://localhost:5001/api/health
```

---

## Update Frontend Configuration

If you're running the frontend, you'll also need to update it to point to port 5001:

```bash
# Update client/.env or client API configuration
# Change from: http://localhost:5000
# Change to:   http://localhost:5001
```

---

## What Ports Are Currently In Use?

Run this to see all ports in use:

```bash
lsof -PiTCP -sTCP:LISTEN | grep -E "(COMMAND|node|5000|5001)"
```

---

## Recommended Port Numbers

- **5001** - Node.js backend server (recommended)
- **3000** - React frontend (default)
- **5432** - PostgreSQL (if used)
- **27017** - MongoDB (if used)
- **6379** - Redis (if used)

---

**Status:** Port configuration updated in `server/env.example` to use **5001** by default.

