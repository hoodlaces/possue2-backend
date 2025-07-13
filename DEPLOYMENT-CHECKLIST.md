# 🚨 MANDATORY DEPLOYMENT CHECKLIST - USER DATA PROTECTION

## ⚠️ CRITICAL WARNING
**THIS CHECKLIST MUST BE COMPLETED BEFORE ANY DEPLOYMENT TO PRODUCTION**

**User data is IRREPLACEABLE. One mistake can cause permanent data loss.**

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. 🛡️ BACKUP VERIFICATION (MANDATORY)

**This step is REQUIRED and cannot be skipped.**

- [ ] **Run pre-deployment backup script**
  ```bash
  chmod +x scripts/pre-deployment-backup.sh
  ./scripts/pre-deployment-backup.sh
  ```

- [ ] **Verify backup completed successfully**
  - [ ] Check for "✅ Ready for deployment" message
  - [ ] Confirm backup files exist in `backups/pre-deployment/`
  - [ ] Verify user count in backup logs

- [ ] **Save backup timestamp**: ________________

### 2. 🗃️ DATABASE MIGRATION SAFETY

**Required for schema changes (like email verification fields)**

- [ ] **Review migration scripts**
  - [ ] Check `database/manual-migrations/000-create-migration-log.sql`
  - [ ] Check `database/manual-migrations/001-add-email-verification-fields.sql`

- [ ] **Apply migrations to production database**
  ```bash
  # Connect to production database and run:
  psql $DATABASE_URL -f database/manual-migrations/000-create-migration-log.sql
  psql $DATABASE_URL -f database/manual-migrations/001-add-email-verification-fields.sql
  ```

- [ ] **Verify migration success**
  - [ ] Check migration_log table for completion status
  - [ ] Verify new columns exist: `confirmation_token_expiry`, `email_verified_at`

### 3. 🔧 ENVIRONMENT CONFIGURATION

- [ ] **Verify environment variables in Render dashboard**
  - [ ] `DATABASE_URL` is set and points to correct database
  - [ ] `SENDGRID_API_KEY` is production key
  - [ ] `SENDGRID_FROM_EMAIL` is verified sender
  - [ ] `CLIENT_URL` is set to `https://possue.com`
  - [ ] All other required vars from `.env.example`

- [ ] **CRITICAL: Confirm DATABASE_URL**
  - [ ] Database URL points to live production database
  - [ ] Contains existing user data
  - [ ] **NEVER** change this without explicit backup

### 4. 📧 EMAIL SYSTEM VERIFICATION

- [ ] **SendGrid account status**
  - [ ] API key is active
  - [ ] Sender email is verified
  - [ ] Domain authentication is set up
  - [ ] No sending limits will be hit

- [ ] **Email template verification**
  - [ ] Template exists: `src/extensions/users-permissions/email-templates/email-confirmation.html`
  - [ ] Template variables are correct: `CLIENT_URL`, `CODE`

### 5. 🔒 SECURITY CHECKLIST

- [ ] **Rate limiting is configured**
  - [ ] Middleware files exist and are imported correctly
  - [ ] No import errors for `auth-rate-limit.js`

- [ ] **CORS settings are correct**
  - [ ] Allow origin: `https://possue.com`
  - [ ] Required headers are allowed

---

## 🚀 DEPLOYMENT PROCESS

### Step 1: Final Pre-Deployment Check
- [ ] All items in pre-deployment checklist completed ✅
- [ ] Backup verified and saved ✅
- [ ] Database migrations applied ✅
- [ ] Environment variables confirmed ✅

### Step 2: Deploy to Render
- [ ] **Git commit and push**
  ```bash
  git add .
  git commit -m "Deploy email verification system with user data protection"
  git push origin main
  ```

- [ ] **Monitor deployment in Render dashboard**
  - [ ] Watch build logs for errors
  - [ ] Confirm no database connection errors
  - [ ] Check for successful startup

### Step 3: Immediate Post-Deployment Verification
- [ ] **Run post-deployment verification script**
  ```bash
  chmod +x scripts/post-deployment-verification.sh
  ./scripts/post-deployment-verification.sh https://your-api-domain.com
  ```

- [ ] **Verify API responses**
  - [ ] Registration endpoint working
  - [ ] Email confirmation working
  - [ ] Debug endpoints accessible

### Step 4: User Data Integrity Check
- [ ] **Compare user counts**
  - [ ] Pre-deployment user count: ________
  - [ ] Post-deployment user count: ________
  - [ ] **CRITICAL**: Post-deployment count >= Pre-deployment count

- [ ] **Test email verification flow**
  - [ ] Create test user account
  - [ ] Verify email is sent
  - [ ] Confirm email verification works
  - [ ] Delete test account

---

## 🆘 EMERGENCY PROCEDURES

### If Deployment Fails
1. **IMMEDIATELY** run emergency rollback procedures (see EMERGENCY-ROLLBACK-PROCEDURES.md)
2. Contact system administrator
3. Do NOT attempt additional deployments until issue resolved

### If User Data Issues Detected
1. **STOP** all operations immediately
2. Run rollback procedures
3. Restore from pre-deployment backup
4. Investigate issue before retry

### Emergency Contacts
- **System Administrator**: [Your contact info]
- **Database Administrator**: [Your contact info]
- **Backup Location**: `backups/pre-deployment/`

---

## 📋 POST-DEPLOYMENT MONITORING

### First 24 Hours
- [ ] **Monitor error logs** in Render dashboard
- [ ] **Check email delivery rates** in SendGrid
- [ ] **Monitor user registration** for issues
- [ ] **Verify no increase** in 500 errors

### Weekly Follow-up
- [ ] **Review verification statistics** using debug endpoints
- [ ] **Check backup retention** (keep current backups until confirmed stable)
- [ ] **Monitor user complaints** about email/registration issues

---

## 📝 DEPLOYMENT LOG

**Deployment Date**: ________________  
**Deployed By**: ________________  
**Pre-deployment Backup ID**: ________________  
**Post-deployment Verification ID**: ________________  

### Issues Encountered:
_None (if successful) or list any issues and resolutions_

### Verification Results:
- [ ] All API endpoints working
- [ ] User data integrity confirmed  
- [ ] Email verification flow tested
- [ ] No data loss detected

**Deployment Status**: ✅ SUCCESS / ❌ FAILED / ⚠️ PARTIAL

---

## 🔄 FOR FUTURE DEPLOYMENTS

### Before Every Deployment:
1. **ALWAYS** run this checklist completely
2. **NEVER** skip backup procedures
3. **ALWAYS** verify user data integrity
4. **KEEP** backups until confirmed stable

### Schema Changes:
1. Create migration scripts first
2. Test migrations on staging
3. Apply migrations before deployment
4. Verify migration success

### Emergency Preparedness:
1. Keep emergency rollback procedures updated
2. Maintain current contact information
3. Test rollback procedures periodically
4. Document any new risks or procedures

---

**⚠️ REMEMBER: User data is irreplaceable. When in doubt, backup twice and verify three times.**