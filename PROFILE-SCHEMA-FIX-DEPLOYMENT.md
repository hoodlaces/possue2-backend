# Profile Schema Fix Deployment Guide

## Overview
This guide provides instructions for fixing the production profile save issues caused by schema mismatch between local and production environments.

## Problem Summary
- **Issue**: Production Strapi treats `lawSchool` as a relation field, but it should be a string field
- **Symptoms**: Profile saves fail with 500 errors, fallback to temporary storage
- **Root Cause**: Schema mismatch between local development and production Strapi

## Solution Approach
1. **Database Migration**: Convert `lawSchool` field from relation to VARCHAR
2. **Enhanced Code**: Deploy improved sanitization and error handling
3. **Schema Verification**: Confirm all changes work correctly

---

## Pre-Deployment Requirements

### ⚠️ CRITICAL: Backup First
```bash
# Always backup production database before schema changes
cd possue2-backend
./scripts/pre-deployment-backup.sh

# Alternative manual backup:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Environment Setup
```bash
# Ensure you have database access
export DATABASE_URL="your-production-database-url"
psql $DATABASE_URL -c "SELECT version();"

# Verify Node.js and npm versions
node --version  # Should be 18.x or 20.x
npm --version
```

---

## Deployment Steps

### Option 1: Automated Deployment (Recommended)
```bash
cd possue2-backend

# Run the automated deployment script
node scripts/deploy-schema-changes.js

# Follow the script output and prompts
```

### Option 2: Manual Step-by-Step Deployment

#### Step 1: Deploy Updated Code
```bash
# Push the enhanced sanitization code to production
git add .
git commit -m "Fix profile schema issues with enhanced sanitization"
git push origin main

# Wait for Render.com to deploy the changes
# Check deployment status at: https://dashboard.render.com/
```

#### Step 2: Run Database Migration
```bash
cd possue2-backend

# Ensure migration log table exists
psql $DATABASE_URL -f database/manual-migrations/000-create-migration-log.sql

# Execute the law school field fix
psql $DATABASE_URL -f database/manual-migrations/003-fix-law-school-field.sql
```

#### Step 3: Verify Schema Changes
```bash
# Run verification script
node scripts/verify-schema-sync.js

# Check migration status
psql $DATABASE_URL -c "SELECT * FROM migration_log WHERE migration_name = '003-fix-law-school-field';"
```

#### Step 4: Restart Strapi
```bash
# Restart the Strapi application to reload schema
# On Render.com: Go to dashboard and click "Manual Deploy" or wait for auto-deploy
```

---

## Verification Checklist

### Database Schema Verification
- [ ] `user_profiles.law_school` field is VARCHAR/TEXT type
- [ ] `law_school` field allows NULL values
- [ ] All enum fields accept NULL values for empty dropdowns
- [ ] Migration logged as 'COMPLETED' in migration_log table

### Application Testing
- [ ] Profile page loads without errors
- [ ] Dropdown selections can be saved
- [ ] Law school selection persists after save
- [ ] No more "fallback storage" warnings in logs
- [ ] Debug logs show successful Strapi saves

### Production Monitoring
```bash
# Check application logs for successful saves
# Look for these log messages:
# ✅ Strapi profile creation successful
# ✅ Profile saved successfully to database

# Verify no more fallback warnings:
# ⚠️ Profile data is from fallback - may not be persistent
```

---

## Expected Results After Deployment

### ✅ Fixed Issues
- **Profile saves work correctly**: Dropdown selections persist in database
- **No more 500 errors**: Strapi accepts all profile data formats
- **String law school field**: Law school names stored as text, not relations
- **Enhanced error messages**: Better debugging for any remaining issues

### 🔍 Log Output Changes
**Before (Problem):**
```
🔗 Data source: fallback
⚠️ Profile data is from fallback - may not be persistent
❌ Strapi profile creation failed: 400
```

**After (Fixed):**
```
🔗 Data source: strapi  
✅ Strapi profile creation successful
📊 Profile saved successfully to database
```

---

## Troubleshooting

### Common Issues

#### "Migration log table does not exist"
```bash
# Solution: Create the migration log table first
psql $DATABASE_URL -f database/manual-migrations/000-create-migration-log.sql
```

#### "law_school field still appears as integer"
```bash
# Check if migration ran successfully
psql $DATABASE_URL -c "SELECT * FROM migration_log WHERE migration_name = '003-fix-law-school-field';"

# If status is not 'COMPLETED', re-run the migration
psql $DATABASE_URL -f database/manual-migrations/003-fix-law-school-field.sql
```

#### "Profile saves still show fallback warnings"
1. Verify Strapi has been restarted after schema changes
2. Check that the enhanced sanitization code is deployed
3. Test with network dev tools to see actual API responses

#### "Enum validation errors persist"
```bash
# Check enum fields in database
psql $DATABASE_URL -c "
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('current_semester', 'academic_standing', 'gpa_range');
"
```

### Emergency Rollback
If anything goes wrong:
```bash
# 1. Stop the deployment immediately
# 2. Check EMERGENCY-ROLLBACK-PROCEDURES.md
# 3. Restore from backup:
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql
# 4. Restart Strapi application
```

---

## File Changes Summary

### New Files Created
- `database/manual-migrations/003-fix-law-school-field.sql` - Database migration
- `scripts/verify-schema-sync.js` - Schema verification script  
- `scripts/deploy-schema-changes.js` - Automated deployment script
- `PROFILE-SCHEMA-FIX-DEPLOYMENT.md` - This deployment guide

### Modified Files
- `app/api/profile/[userId]/route.js` - Enhanced sanitization and error logging
- `app/components/profile/ProfileAcademicInfo.js` - Better error handling and validation
- `app/components/profile/ProfileBarInfo.js` - Improved error display

---

## Support and Contacts

### For Issues During Deployment
1. **Check the logs**: Both application and database logs for error details
2. **Verify backups**: Ensure you have a recent backup before proceeding
3. **Test incrementally**: Run each step and verify before proceeding
4. **Monitor production**: Watch for user reports or error rates

### Emergency Procedures
- **Database Issues**: Restore from backup, investigate offline
- **Application Issues**: Revert code deployment, check logs
- **Schema Problems**: Use rollback procedures, verify with verification script

---

## Success Criteria

The deployment is successful when:
- ✅ Profile dropdown selections save without errors
- ✅ Data persists between user sessions  
- ✅ Debug logs show Strapi saves (not fallback)
- ✅ No 500 errors on profile save attempts
- ✅ Law school field accepts string names
- ✅ Schema verification script passes all checks

After successful deployment, users should be able to:
- Select law schools from dropdown and have them persist
- Choose academic standing, GPA range, semester options
- Save profile sections without receiving error messages
- See their data when they return to the profile page