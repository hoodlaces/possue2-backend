# Production Email Configuration Guide

## Environment Variables for Production

When deploying to production, ensure these environment variables are set correctly:

### Required Production Environment Variables

```bash
# Client URL (Production Frontend)
CLIENT_URL=https://possue.com

# Email Verification URLs (Production)
EMAIL_CONFIRMATION_URL=https://possue.com/email-confirmation-redirection
EMAIL_CONFIRMATION_REDIRECT_URL=https://possue.com/verify-email/success
EMAIL_CONFIRMATION_FAILURE_URL=https://possue.com/verify-email/error

# SendGrid Configuration (Production)
SENDGRID_API_KEY=your_production_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@possue.com
SENDGRID_TEST_EMAIL=test@possue.com

# Production Server URL
RENDER_EXTERNAL_URL=https://possue2-backend.onrender.com
```

## Email Template Configuration

### Development Template (uses localhost)
```html
<p>Thank you for registering!</p>
<p>You have to confirm your email address. Please click on the link below.</p>
<p><a href="<%= CLIENT_URL %>/email-confirmation-redirection?confirmation=<%= CODE %>">Confirm your email address</a></p>
<p>Thanks.</p>
```

### How It Works
- **Development**: `CLIENT_URL=http://localhost:3000` → emails link to localhost
- **Production**: `CLIENT_URL=https://possue.com` → emails link to production domain
- **Same template works in both environments** by using the `CLIENT_URL` environment variable

## Deployment Checklist

### Before Deploying:
1. ✅ Update `CLIENT_URL` to production domain
2. ✅ Update all email confirmation URLs to use production domain
3. ✅ Test SendGrid configuration with production API key
4. ✅ Verify email templates use `<%= CLIENT_URL %>` variable
5. ✅ Test complete registration → email → confirmation flow

### After Deployment:
1. Test user registration on production
2. Check email delivery and link functionality
3. Verify email confirmation redirects work correctly
4. Monitor for any email-related errors

## Email Template Update Instructions

1. Access Strapi Admin Panel: `https://your-backend-url.com/admin`
2. Go to Settings → Users & Permissions plugin → Email Templates
3. Update "Email Address Confirmation" template to use:
   ```html
   <a href="<%= CLIENT_URL %>/email-confirmation-redirection?confirmation=<%= CODE %>">
   ```
4. Save changes
5. Test with a new user registration

## Troubleshooting

### Common Issues:
- **Links point to localhost in production**: Check that `CLIENT_URL` is set correctly in production environment
- **404 errors on email confirmation**: Verify frontend routes match the configured paths
- **Email not delivered**: Check SendGrid API key and domain verification
- **Template not updating**: Clear Strapi cache and restart the application

### Testing Email Templates:
```bash
# Test email generation locally
curl -X POST http://localhost:1337/api/auth/local/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

## Security Notes

- Never commit production API keys to version control
- Use environment variables for all sensitive configuration
- Ensure email confirmation URLs use HTTPS in production
- Verify CORS settings allow your production frontend domain