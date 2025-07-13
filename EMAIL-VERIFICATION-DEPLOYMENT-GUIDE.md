# Email Verification System - Deployment Guide

## Overview
This guide covers the deployment and configuration of the enhanced email verification system for the Possue backend application.

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set in your production environment:

```bash
# SendGrid Email Configuration
SENDGRID_API_KEY=your_production_sendgrid_api_key
SENDGRID_FROM_EMAIL=info@possue.com
SENDGRID_FROM_NAME=Possue Team

# Frontend URLs
CLIENT_URL=https://possue.com

# Security Configuration
CONFIRMATION_TOKEN_EXPIRY_HOURS=24
JWT_SECRET=your_secure_jwt_secret

# Database Configuration
DATABASE_PASSWORD=your_secure_database_password
DATABASE_HOST=your_database_host
DATABASE_PORT=5432
DATABASE_NAME=your_database_name
DATABASE_USERNAME=your_database_user
```

### 2. SendGrid Configuration
- ✅ Verify SendGrid API key is active and has sending permissions
- ✅ Confirm sender email (info@possue.com) is verified in SendGrid
- ✅ Test email delivery to various email providers (Gmail, Yahoo, Outlook)
- ✅ Set up domain authentication (SPF, DKIM) in SendGrid
- ✅ Configure webhook endpoints for bounce/spam notifications (optional)

### 3. Database Schema Updates
Run the following SQL to add new fields to the user table:

```sql
-- Add new fields to users table
ALTER TABLE up_users 
ADD COLUMN confirmation_token_expiry TIMESTAMP,
ADD COLUMN email_verified_at TIMESTAMP;

-- Index for performance
CREATE INDEX idx_users_confirmation_token_expiry ON up_users(confirmation_token_expiry);
CREATE INDEX idx_users_email_verified_at ON up_users(email_verified_at);
```

### 4. Frontend Integration Points
Ensure your frontend handles these endpoints:

- **Registration**: `POST /api/auth/local/register`
- **Email Confirmation**: `GET /api/auth/email-confirmation?confirmation=TOKEN`
- **Email Confirmation Redirect**: `GET /email-confirmation-redirection?confirmation=TOKEN`

## 🚀 Deployment Steps

### Step 1: Update Environment Variables
1. Set all required environment variables in your hosting platform
2. Verify `CLIENT_URL` points to your production frontend domain
3. Ensure `SENDGRID_API_KEY` is your production key

### Step 2: Deploy Backend Changes
1. Deploy the updated Strapi backend with all modifications
2. Restart the application to load new environment variables
3. Verify the custom auth controllers are loaded

### Step 3: Test Email Verification Flow
Run the comprehensive test suite:

```bash
node test-email-verification-comprehensive.js
```

### Step 4: Monitor and Debug
Use the debug endpoints to monitor the system:

```bash
# Check verification statistics
curl https://your-api.com/api/debug/verification/stats

# Check specific user status
curl https://your-api.com/api/debug/verification/status/user@example.com

# Resend verification email
curl -X POST https://your-api.com/api/debug/verification/resend \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

## 🔧 Monitoring and Maintenance

### Daily Monitoring
- Check email delivery rates in SendGrid dashboard
- Monitor error logs for email sending failures
- Review verification completion rates

### Weekly Maintenance
- Run cleanup script to remove expired tokens:
  ```bash
  curl -X POST https://your-api.com/api/debug/verification/cleanup
  ```
- Check verification statistics and trends
- Review rate limiting effectiveness

### Monthly Audits
- Audit user verification completion rates
- Review and update email templates if needed
- Check for any security incidents or abuse

## 🔐 Security Considerations

### Rate Limiting
The system includes built-in rate limiting:
- **Registration**: 5 attempts per hour per IP
- **Email Confirmation**: 10 attempts per hour per IP  
- **Resend Email**: 3 attempts per hour per email address

### Token Security
- Confirmation tokens expire after 24 hours (configurable)
- Tokens are cryptographically secure (32 bytes random)
- Expired tokens are automatically cleared

### CORS Configuration
Ensure CORS is properly configured for your frontend domain:

```javascript
// In config/middlewares.js
'strapi::cors': {
  enabled: true,
  config: {
    origin: [process.env.CLIENT_URL, 'https://possue.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    keepHeaderOnError: true,
  },
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Emails Not Sending
- ✅ Check SENDGRID_API_KEY is set correctly
- ✅ Verify sender email is authenticated in SendGrid
- ✅ Check Strapi logs for email sending errors
- ✅ Test with debug resend endpoint

#### 2. Tokens Expiring Too Quickly
- ✅ Check CONFIRMATION_TOKEN_EXPIRY_HOURS setting
- ✅ Verify server timezone is correct
- ✅ Check token generation logic in registration controller

#### 3. Rate Limiting Too Aggressive
- ✅ Review rate limit settings in auth-rate-limit.js
- ✅ Check if legitimate users are being blocked
- ✅ Consider IP whitelisting for known good IPs

#### 4. Frontend Integration Issues
- ✅ Verify CLIENT_URL matches your frontend domain
- ✅ Check email template links are correct
- ✅ Test email confirmation redirect flow

### Debug Commands

```bash
# Check overall system health
node debug-email-verification.js

# Clean up expired tokens
node debug-email-verification.js cleanup

# Test registration flow
node test-email-verification-comprehensive.js
```

## 📊 Performance Optimization

### Database Indexes
Ensure these indexes exist for optimal performance:

```sql
CREATE INDEX idx_users_confirmation_token ON up_users(confirmation_token);
CREATE INDEX idx_users_confirmed ON up_users(confirmed);
CREATE INDEX idx_users_email ON up_users(email);
```

### Email Template Caching
The email template is read from disk on each send. For high-volume applications, consider caching the template in memory.

### Rate Limit Storage
The current rate limiting uses in-memory storage. For production with multiple servers, consider using Redis:

```javascript
// Example Redis-based rate limiting (requires implementation)
const Redis = require('redis');
const redis = Redis.createClient(process.env.REDIS_URL);
```

## 📈 Analytics and Metrics

Track these key metrics:
- Email delivery rate (SendGrid dashboard)
- Verification completion rate
- Time from registration to verification
- Rate limiting trigger frequency
- Failed email attempts by type

## 🔄 Backup and Recovery

### Database Backups
Ensure regular backups include the user table with new verification fields:

```bash
pg_dump -t up_users your_database > users_backup.sql
```

### Configuration Backups
Backup environment variables and Strapi configuration files regularly.

## 📞 Support and Escalation

For issues requiring immediate attention:
1. Check Strapi application logs
2. Review SendGrid delivery logs
3. Use debug endpoints for system status
4. Check rate limiting logs for unusual patterns

Critical issues should include:
- Error messages and stack traces
- Environment details (production/staging)
- Steps to reproduce the issue
- Impact on user registration flow