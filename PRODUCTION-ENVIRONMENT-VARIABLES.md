# Production Environment Variables for Render Deployment

## CRITICAL: Email Verification Configuration

### Required Environment Variables on Render:

```bash
# Email Service Configuration
EMAIL_BYPASS_DEVELOPMENT=false
# OR remove this variable entirely - it should not exist in production

# Production Client URLs (replace with your actual domain)
CLIENT_URL=https://your-frontend-domain.vercel.app
EMAIL_CONFIRMATION_URL=https://your-frontend-domain.vercel.app/email-confirmation-redirection
EMAIL_CONFIRMATION_REDIRECT_URL=https://your-frontend-domain.vercel.app/verify-email/success
EMAIL_CONFIRMATION_FAILURE_URL=https://your-frontend-domain.vercel.app/verify-email/error

# SendGrid Configuration (should already be set)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=info@possue.com
SENDGRID_FROM_NAME=Possue Team

# Database (should already be set by Render)
DATABASE_URL=postgresql://...
```

## Current Issue:
The production backend has `EMAIL_BYPASS_DEVELOPMENT=true` which prevents proper email sending.

## Fix Required:
1. Set `EMAIL_BYPASS_DEVELOPMENT=false` in Render environment variables
2. Update CLIENT_URL and email verification URLs to point to production domain
3. Restart the Render backend service

## Steps to Fix:
1. Go to Render dashboard → Your backend service → Environment
2. Add/Update these environment variables
3. Deploy/restart the service