# Troubleshooting Guide

## Issue: "Not authorized, no token"

### Solution

1. **Make sure you're logged in:**
   - Go to http://localhost:3000/login
   - Login with:
     - Email: `demo@cloudoptimizer.com`
     - Password: `password123`
   - This will save a token in localStorage

2. **Check if backend is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"OK","message":"Cloud Cost Optimizer API (Test Mode)","mode":"mock-data"}`

3. **Check if frontend is running:**
   ```bash
   curl http://localhost:3000
   ```
   Should return HTML with `<title>Cloud Cost Optimizer</title>`

4. **Clear browser cache and localStorage:**
   - Open browser DevTools (F12)
   - Go to Application tab
   - Clear Local Storage
   - Refresh page and login again

5. **Verify API connection:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to login
   - Check if the `/api/auth/login` request succeeds
   - Check if response contains a `token`
   - Check if subsequent requests include `Authorization: Bearer <token>` header

## Issue: "Failed to load dashboard data"

### Causes:
1. Backend not running
2. Missing authentication token
3. API endpoint errors

### Solution:
```bash
# Restart backend
cd /home/achal/cloud-cost-optimizer
npm run server:test

# In another terminal, restart frontend
cd /home/achal/cloud-cost-optimizer/client
npm start
```

## Quick Fix - Start Everything Fresh

```bash
# Kill all node processes
pkill -f node

# Start backend
cd /home/achal/cloud-cost-optimizer
node server/index-test.js &

# Wait for backend to start (5 seconds)
sleep 5

# Start frontend
cd /home/achal/cloud-cost-optimizer/client
npm start &
```

## Test API Directly

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@cloudoptimizer.com","password":"password123"}'

# Save the token from response and test authenticated endpoint
TOKEN="eyJhbGci..." # Replace with actual token from login response

curl http://localhost:5000/api/recommendations \
  -H "Authorization: Bearer $TOKEN"
```

## Common Issues

### 1. Port already in use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### 2. Missing aws-sdk package
```bash
cd /home/achal/cloud-cost-optimizer
npm install aws-sdk
```

### 3. Frontend compilation errors
```bash
cd /home/achal/cloud-cost-optimizer/client
rm -rf node_modules
npm install
```

## Working Endpoints

All these should work with a valid token:

```bash
# Health check (no auth needed)
GET /api/health

# Authentication
POST /api/auth/login
POST /api/auth/register

# Costs (auth needed)
GET /api/costs/overview
GET /api/costs/breakdown
GET /api/costs/forecast

# Recommendations (auth needed)
GET /api/recommendations
POST /api/recommendations/generate

# Resources (auth needed)
GET /api/resources
POST /api/resources/scan

# Budgets (auth needed)
GET /api/budgets
POST /api/budgets

# Alerts (auth needed)
GET /api/alerts/history
GET /api/alerts/settings
POST /api/alerts/test

# Data Flow (auth needed)
GET /api/data/insights
GET /api/data/analytics
POST /api/data/process
```

## Contact Support

If issues persist, check:
- Server logs in terminal where `node server/index-test.js` is running
- Browser console (F12 → Console tab)
- Network tab for failed requests
