# 🔐 Database Password Rotation Guide

## Current Status
All scripts have been updated to use environment variables instead of hardcoded passwords for enhanced security.

## Step 1: Rotate Password in Render Dashboard

1. **Access Render Dashboard**: 
   - Go to: https://dashboard.render.com/d/dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com
   - Or navigate to your PostgreSQL service: `possue2_db_v5`

2. **Rotate Password**:
   - Look for "Access" or "Settings" tab
   - Find "Rotate Password" or "Reset Password" option
   - Click to generate a new password
   - **Copy the new password immediately** - you'll need it for the next steps

## Step 2: Update Environment Variables

### For Production (Render.com Service)
1. Go to your Render service: https://dashboard.render.com/web/srv-cbng55ha6gds3kmf2890
2. Navigate to "Environment" tab
3. Update the `DATABASE_PASSWORD` environment variable with the new password
4. The `DATABASE_URL` should auto-update, but verify it contains the new password

### For Local Development
1. Create or update `.env.local` file in project root:
   ```bash
   DATABASE_PASSWORD=your_new_password_here
   ```

2. Or export it in your terminal session:
   ```bash
   export DATABASE_PASSWORD=your_new_password_here
   ```

## Step 3: Test Connection

### Test Local Scripts
```bash
# Set the new password
export DATABASE_PASSWORD=your_new_password_here

# Test database connection
npm run seo:test

# Test a simple database query
./scripts/update-db-credentials.sh
```

### Test Production Deployment
- Your Render service should automatically redeploy with the new environment variables
- Monitor the deployment logs for any connection issues
- Test API endpoints to ensure database connectivity

## Updated Files

The following files now use environment variables:

### JavaScript Files
- ✅ `scripts/bulk-seo-generator.js`
- ✅ `scripts/test-seo-implementation.js` 
- ✅ `scripts/check-essay-counts.js`

### Shell Scripts  
- ✅ `scripts/fix-essay-sync.sh`
- ✅ `scripts/complete-essay-sync.sh`
- ✅ `scripts/direct-sync-essays.sh`
- ✅ `scripts/sync-new-essays.sh`
- ✅ `scripts/restore-selective.sh`
- ✅ `scripts/backup-selective.sh`

### New Security Files
- ✅ `.env.example` - Template for environment variables
- ✅ `scripts/update-db-credentials.sh` - Helper script for validation

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_PASSWORD` | ✅ Yes | None | Database password (must be set) |
| `DATABASE_HOST` | No | `dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com` | Database host |
| `DATABASE_PORT` | No | `5432` | Database port |
| `DATABASE_NAME` | No | `possue2_db_v5` | Database name |
| `DATABASE_USERNAME` | No | `possue2_db_v5_user` | Database username |

## Security Benefits

✅ **No Hardcoded Passwords**: All passwords removed from source code  
✅ **Environment Variable Validation**: Scripts check for required variables  
✅ **Flexible Configuration**: Easy to change without code updates  
✅ **Production Ready**: Compatible with hosting provider environment systems  
✅ **Version Control Safe**: Sensitive data excluded from git repository  

## Troubleshooting

### Error: "DATABASE_PASSWORD environment variable is required"
- Set the environment variable: `export DATABASE_PASSWORD=your_password`
- Or create a `.env.local` file with the password

### Connection timeout or authentication errors
- Verify the new password is correct
- Check that all environment variables are properly set in your hosting provider
- Ensure the `DATABASE_URL` environment variable (if used) contains the new password

### Scripts still failing after password rotation
- Double-check the password was updated in both Render dashboard and your environment variables
- Verify the database service is running and accessible
- Test connection with a simple psql command

## Need Help?

If you encounter issues during password rotation:
1. Check Render.com service logs for connection errors
2. Verify all environment variables are set correctly
3. Test database connectivity with the new credentials
4. Contact support if the database service appears to be down

---

**Remember**: Keep the new password secure and never commit it to version control!