# 🔐 Kite Connect Authentication Guide

## Why Authentication is Required

Zerodha Kite Connect uses OAuth 2.0 authentication. You cannot directly use API Key and Secret to make API calls. You **must** generate an access token through the OAuth flow.

## Authentication Flow

```
1. User clicks "Login" → Redirected to Kite login page
2. User enters credentials → Authorizes the app
3. Kite redirects back → With request_token
4. App generates checksum → Creates access_token  
5. Access token saved → Used for all API calls
```

## Quick Start (Step-by-Step)

### Prerequisites
- Kite Connect app created at https://developers.kite.trade/
- `KITE_API_KEY` and `KITE_API_SECRET` in your `.env` file
- Backend server running

### Step 1: Update Your `.env`
```env
DEMO_MODE=false          # Must be false for real API
DEMO_MODE_DB=true        # Can be true to avoid MongoDB
KITE_API_KEY=your_api_key_here
KITE_API_SECRET=your_api_secret_here
KITE_ACCESS_TOKEN=       # Leave empty, will be auto-generated
```

### Step 2: Configure Redirect URL in Kite Console

Go to https://developers.kite.trade/ and set your app's redirect URL to:
```
http://localhost:5000/auth.html
```

### Step 3: Start Backend Server
```bash
cd d:\AI\Zerodha\AlgoTrading
npm run dev
```

### Step 4: Open Authentication Page

Open your browser to:
```
http://localhost:5000/auth.html
```

### Step 5: Login with Kite

1. Click "🔑 Login with Kite" button
2. You'll be redirected to Zerodha Kite login page
3. Enter your Kite credentials (user ID + password + PIN)
4. Click "Authorize" to grant permissions
5. You'll be automatically redirected back

### Step 6: Done! ✅

The access token is now:
- ✅ Generated and saved to `.kite_token` file
- ✅ Automatically loaded on server restart
- ✅ Used for all API calls

## API Endpoints

### Get Login URL
```http
GET /api/auth/login-url
```

**Response:**
```json
{
  "success": true,
  "loginUrl": "https://kite.zerodha.com/connect/login?api_key=your_key",
  "instructions": "Redirect user to this URL to authorize the app"
}
```

### Generate Access Token
```http
POST /api/auth/generate-token
Content-Type: application/json

{
  "request_token": "xyz123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "abc123...",
    "user_id": "AB1234",
    "user_name": "John Doe",
    "checksum": "sha256_hash..."
  }
}
```

### Validate Token
```http
GET /api/auth/validate
```

**Response:**
```json
{
  "success": true,
  "valid": true
}
```

### Get Session Info
```http
GET /api/auth/session
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "AB1234",
    "user_name": "John Doe",
    "email": "john@example.com",
    "broker": "ZERODHA",
    "available_cash": 50000.50,
    "exchanges": ["NSE", "BSE", "NFO", "BFO"]
  }
}
```

### Logout (Invalidate Token)
```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## How It Works Internally

### 1. Checksum Generation
```javascript
const checksum = crypto
  .createHash('sha256')
  .update(api_key + request_token + api_secret)
  .digest('hex');
```

### 2. Access Token Generation
```javascript
const response = await kite.generateSession(request_token, api_secret);
// Returns: { access_token, user_id, user_name, ... }
```

### 3. Token Persistence
Token is saved to `.kite_token` file:
```json
{
  "access_token": "...",
  "user_id": "AB1234",
  "user_name": "John Doe",
  "generated_at": "2026-02-23T12:00:00.000Z",
  "checksum": "..."
}
```

### 4. Auto-load on Server Start
The backend automatically loads the saved token when it starts:
```javascript
await authService.loadSavedAccessToken();
```

## Token Expiry

⚠️ **Important:** Access tokens expire daily at 6:00 AM IST

**What happens when token expires:**
- API calls will fail with "Token expired" error
- You need to login again through the auth flow
- A new access token will be generated

**Automation:**
You can automate re-authentication by:
1. Detecting token expiry errors
2. Triggering the auth flow automatically
3. Or using a headless browser to login daily

## Security Best Practices

### ✅ DO:
- Keep `.kite_token` file secure (already in `.gitignore`)
- Never commit API keys or tokens to version control
- Use environment variables for sensitive data
- Validate tokens before making API calls

### ❌ DON'T:
- Share your access token publicly
- Hardcode API keys in code
- Use the same token across multiple instances
- Store tokens in publicly accessible locations

## Troubleshooting

### Error: "Invalid API credentials"
- Check `KITE_API_KEY` and `KITE_API_SECRET` in `.env`
- Verify they match your Kite Connect app

### Error: "Invalid request token"
- Request tokens expire in a few minutes
- Complete the auth flow quickly
- Don't refresh the redirect page

### Error: "Redirect URL mismatch"
- Update redirect URL in Kite Console to match your server
- Must be exact match (including http/https and port)

### Token saved but still getting errors
- Token might have expired (daily at 6:00 AM IST)
- Delete `.kite_token` and login again
- Check if token is valid: `GET /api/auth/validate`

### Cannot access /auth.html
- Ensure backend server is running on port 5000
- Check if `public` folder exists
- Verify `auth.html` is in the `public` folder

## Integration with Your App

### Frontend (React) Integration

```javascript
// Check if authenticated
const checkAuth = async () => {
  const response = await fetch('http://localhost:5000/api/auth/validate');
  const data = await response.json();
  return data.valid;
};

// Get login URL and redirect
const login = async () => {
  const response = await fetch('http://localhost:5000/api/auth/login-url');
  const data = await response.json();
  window.location.href = data.loginUrl;
};

// Get session info
const getSession = async () => {
  const response = await fetch('http://localhost:5000/api/auth/session');
  const data = await response.json();
  return data.data;
};
```

### Backend Integration

```javascript
const authService = require('./services/auth.service');

// Load saved token on server start
await authService.loadSavedAccessToken();

// Validate before making API calls
const isValid = await authService.validateAccessToken();
if (!isValid) {
  // Token expired, need to re-authenticate
  console.log('Please login again');
}
```

## Demo Mode vs Real Mode

| Feature | Demo Mode | Real Mode |
|---------|-----------|-----------|
| Authentication | Not required | Required (OAuth) |
| API Calls | Mock data | Real Zerodha API |
| Orders | Simulated | Real orders placed |
| Positions | Fake data | Real positions |
| Token Expiry | Never | Daily at 6 AM |

## Summary

1. **Create Kite App** → Get API Key & Secret
2. **Configure Redirect** → Set to `http://localhost:5000/auth.html`
3. **Update .env** → Add API Key & Secret, set `DEMO_MODE=false`  
4. **Run Server** → `npm run dev`
5. **Open Browser** → `http://localhost:5000/auth.html`
6. **Click Login** → Authenticate with Kite
7. **Done!** → Token saved and ready to use

The authentication is a **one-time process per day**. Once authenticated, the token is saved and reused until it expires.
