# Security Guidelines for Possue Backend

## Overview
This document outlines security best practices and guidelines for the Possue Strapi backend to prevent credential exposure and maintain secure operations.

## 🔐 Environment Variables Security

### Required Environment Variables
All sensitive configuration must be stored in environment variables, never hardcoded:

```bash
# Database Configuration
DATABASE_HOST=your_db_host
DATABASE_PORT=5432
DATABASE_NAME=your_db_name
DATABASE_USERNAME=your_db_user
DATABASE_PASSWORD=your_secure_password
DATABASE_URL=postgresql://...

# Strapi Secrets
APP_KEYS=key1,key2,key3,key4
JWT_SECRET=your_jwt_secret
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_token_salt

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_TEST_EMAIL=test@yourdomain.com

# Email Verification URLs
EMAIL_CONFIRMATION_URL=https://api.yourdomain.com/api/auth/email-confirmation
EMAIL_CONFIRMATION_REDIRECT_URL=https://yourdomain.com/email-confirmed

# Admin Password (for scripts)
ADMIN_PASSWORD=your_secure_admin_password
```

### Environment File Security
- ✅ `.env` files are already excluded from git via `.gitignore`
- ✅ Use `.env.example` for environment variable templates (without values)
- ❌ NEVER commit actual `.env` files
- ❌ NEVER include sensitive values in `.env.example`

## 🚫 What NOT to Do

### Hardcoded Credentials (FORBIDDEN)
```javascript
// ❌ NEVER do this
const password = 'MyPassword123';
const apiKey = 'sk_live_abc123...';
const dbConfig = {
  password: '1212'
};
```

### Correct Approach
```javascript
// ✅ Always use environment variables
const password = process.env.ADMIN_PASSWORD;
const apiKey = process.env.SENDGRID_API_KEY;
const dbConfig = {
  password: process.env.DATABASE_PASSWORD
};
```

## 📁 File Security

### Protected Files (via .gitignore)
- All `.env*` files (except `.env.*.example`)
- Files containing `*password*`, `*secret*`, `*token*`, `*key*`
- Database dumps and backups
- SSL certificates and private keys

### Secure File Naming
- ❌ `database-password.txt`
- ❌ `api-keys.js`
- ❌ `production-secrets.json`
- ✅ Use environment variables instead

## 🔄 Credential Rotation

### When to Rotate Credentials
- Immediately after exposure (git commits, logs, etc.)
- Every 90 days for production secrets
- When team members leave
- After security incidents

### How to Rotate
1. Generate new credentials
2. Update environment variables in hosting platform
3. Deploy application with new secrets
4. Revoke old credentials
5. Test functionality

## 🔍 Security Audit Checklist

### Before Each Deployment
- [ ] Check for hardcoded credentials in code
- [ ] Verify `.env` files are not committed
- [ ] Ensure all secrets use environment variables
- [ ] Review git history for exposed credentials
- [ ] Test with non-production credentials first

### Regular Security Reviews
- [ ] Audit environment variable usage
- [ ] Review access logs
- [ ] Check for new security vulnerabilities
- [ ] Update dependencies
- [ ] Rotate long-lived credentials

## 🚨 Incident Response

### If Credentials Are Exposed
1. **IMMEDIATE**: Revoke/rotate all exposed credentials
2. **URGENT**: Remove from git history if committed
3. **ASAP**: Update all systems using those credentials
4. **FOLLOW-UP**: Review how exposure occurred
5. **PREVENT**: Implement additional safeguards

### Emergency Contacts
- Database: Render Dashboard → Database Settings
- Email: SendGrid Dashboard → API Keys
- Hosting: Render Dashboard → API Keys

## 🛠 Tools and Scripts

### Secure Script Guidelines
- Always use environment variables for database connections
- Never log sensitive information
- Include error handling for missing environment variables
- Add warnings about credential requirements

### Pre-commit Hooks (Recommended)
Consider implementing git hooks to:
- Scan for potential secrets before commits
- Validate environment variable usage
- Check for hardcoded credentials

## 📚 Additional Resources

- [Strapi Security Guide](https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/deployment/optional-software/nginx-proxy.html#security-hardening)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SendGrid Security Best Practices](https://sendgrid.com/docs/for-developers/sending-email/api-key-security/)

## 📝 Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2025-07-06 | Created security guidelines | Initial security audit |
| 2025-07-06 | Removed hardcoded passwords from admin scripts | Security vulnerability fix |
| 2025-07-06 | Enhanced .gitignore with security patterns | Prevent future credential exposure |

---

**Remember**: Security is everyone's responsibility. When in doubt, ask for a security review.