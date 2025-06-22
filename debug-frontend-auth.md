# Frontend Authentication Debug Guide

## ✅ Current Status

Your Strapi API permissions are correctly configured:

- ✅ **Essays API**: Working (242 essays available)
- ✅ **Subjects API**: Working (14 subjects available)  
- ✅ **Answers API**: Working (85 answers available)
- ✅ **Public permissions**: Properly set for all content types

## 🔍 Debugging the Forbidden Error

The `ForbiddenError: Forbidden access` suggests your frontend is making requests that require authentication but aren't properly authenticated.

### Common Causes:

1. **Frontend sending invalid JWT token**
2. **Frontend accessing protected endpoints**
3. **Frontend not sending Authorization header correctly**
4. **CORS issues**

## 🧪 Testing Steps

### 1. Test Public API Endpoints
```bash
# These should work without authentication:
curl http://localhost:1337/api/essays
curl http://localhost:1337/api/subjects  
curl http://localhost:1337/api/answers
```

### 2. Check What Your Frontend Is Requesting
Look at the browser's Network tab to see:
- What URL is being requested
- What headers are being sent
- What response is returned

### 3. Common Frontend Issues

#### **Issue A: Wrong Base URL**
Make sure frontend is using: `http://localhost:1337/api/`

#### **Issue B: Including Authorization Header for Public Routes**
Public routes should NOT include Authorization header:
```javascript
// ❌ Wrong - don't send auth for public routes
fetch('http://localhost:1337/api/essays', {
  headers: {
    'Authorization': 'Bearer invalid-token'
  }
})

// ✅ Correct - no auth header for public routes  
fetch('http://localhost:1337/api/essays')
```

#### **Issue C: Trying to Access Protected Routes**
If frontend needs authenticated routes, it needs valid JWT:
```javascript
// First authenticate
const response = await fetch('http://localhost:1337/api/auth/local', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'user@example.com',
    password: 'password'
  })
})
const { jwt } = await response.json()

// Then use JWT for authenticated requests
fetch('http://localhost:1337/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${jwt}`
  }
})
```

#### **Issue D: CORS Problems**
Add to your Strapi middleware config if needed:
```javascript
// config/middlewares.js
module.exports = [
  'strapi::cors',
  // ... other middleware
]
```

## 🔧 Frontend Code Examples

### React/Next.js Example:
```javascript
// Public data fetching (no auth needed)
export async function getEssays() {
  const response = await fetch('http://localhost:1337/api/essays?populate=subjects')
  
  if (!response.ok) {
    throw new Error(`Failed to fetch essays: ${response.status}`)
  }
  
  return response.json()
}

// With error handling
export async function getSubjects() {
  try {
    const response = await fetch('http://localhost:1337/api/subjects')
    
    if (response.status === 403) {
      console.error('Forbidden access - check API permissions')
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    return null
  }
}
```

### Vue.js Example:
```javascript
// In your service/API file
const API_BASE = 'http://localhost:1337/api'

export const api = {
  async getEssays() {
    const response = await fetch(`${API_BASE}/essays?populate=*`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },
  
  async getSubjects() {
    const response = await fetch(`${API_BASE}/subjects`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
}
```

## 🚨 Quick Fixes

### 1. Restart Strapi
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run develop
```

### 2. Check Frontend Network Requests
1. Open browser DevTools (F12)
2. Go to Network tab
3. Make request from frontend
4. Check the failed request details

### 3. Test Direct API Call
```bash
# Test the exact URL your frontend is trying to access
curl -v http://localhost:1337/api/your-specific-endpoint
```

## 📋 Common Solutions

1. **Remove Authorization headers for public routes**
2. **Use correct base URL: `http://localhost:1337/api/`**
3. **Check CORS configuration**
4. **Verify frontend isn't caching old failed requests**

## 🎯 Next Steps

1. Check your frontend network requests in browser DevTools
2. Compare with the working curl commands above
3. Remove any unnecessary Authorization headers
4. Test with the provided code examples

The API is working correctly - the issue is likely in how the frontend is making the requests!