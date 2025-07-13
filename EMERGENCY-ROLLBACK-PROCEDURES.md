# 🆘 EMERGENCY ROLLBACK PROCEDURES

## 🚨 CRITICAL: USER DATA RECOVERY

**Use these procedures IMMEDIATELY if deployment fails or user data issues are detected.**

---

## ⚡ IMMEDIATE ACTION CHECKLIST

### STEP 1: STOP ALL OPERATIONS (IMMEDIATE)
- [ ] **STOP** making any additional changes
- [ ] **STOP** any running deployments in Render
- [ ] **DOCUMENT** what went wrong and when

### STEP 2: ASSESS THE SITUATION (2 minutes)
- [ ] **Check user access**: Can users still access their accounts?
- [ ] **Check user count**: Run verification script to get current user count
- [ ] **Check error logs**: Look for specific error messages in Render logs

### STEP 3: DETERMINE ROLLBACK TYPE (Choose ONE)
- [ ] **Code Rollback Only** (API issues, no data loss detected)
- [ ] **Database Rollback** (Data loss or corruption detected) 
- [ ] **Full System Rollback** (Complete system failure)

---

## 🔄 ROLLBACK TYPE 1: CODE ROLLBACK ONLY

**Use when**: API is broken but user data is intact

### Immediate Steps:
1. **Rollback in Render Dashboard**
   - Go to Render dashboard
   - Navigate to possue2-backend service
   - Click "Rollback" to previous deployment
   - Select the last known good deployment
   - Confirm rollback

2. **Verify Rollback Success**
   ```bash
   # Test API endpoints
   curl https://your-api-domain.com/api
   curl https://your-api-domain.com/api/debug/verification/stats
   ```

3. **Verify User Data Integrity**
   ```bash
   ./scripts/post-deployment-verification.sh https://your-api-domain.com
   ```

### If Code Rollback Succeeds:
- [ ] Document the issue that caused the rollback
- [ ] Investigate the problem before attempting redeployment
- [ ] Update deployment procedures to prevent recurrence

---

## 🗃️ ROLLBACK TYPE 2: DATABASE ROLLBACK

**Use when**: User data loss or corruption is detected

### ⚠️ CRITICAL DATABASE RECOVERY

1. **Find Latest Backup**
   ```bash
   # List recent backups
   ls -la backups/pre-deployment/
   
   # Find the most recent backup before deployment
   # Look for directory like: pre-deployment/critical-backup-YYYYMMDD-HHMMSS
   ```

2. **Verify Backup Integrity**
   ```bash
   # Check backup files exist
   BACKUP_DIR="backups/pre-deployment/[LATEST_BACKUP_DIR]"
   ls -la $BACKUP_DIR/database/
   ls -la $BACKUP_DIR/strapi/
   ```

3. **Restore Database (CRITICAL STEP)**
   ```bash
   # If you have direct database access:
   BACKUP_FILE="$BACKUP_DIR/database/critical-backup-[TIMESTAMP].sql"
   
   # RESTORE DATABASE  
   psql $DATABASE_URL < $BACKUP_FILE
   ```

4. **Restore Strapi Content**
   ```bash
   # Restore Strapi content
   STRAPI_BACKUP="$BACKUP_DIR/strapi/strapi-backup-[TIMESTAMP].tar.gz"
   npx strapi import -f $STRAPI_BACKUP --force
   ```

5. **Verify Recovery**
   ```bash
   # Run full verification
   ./scripts/post-deployment-verification.sh https://your-api-domain.com
   
   # Compare user counts with pre-deployment backup
   cat $BACKUP_DIR/verification/verification-stats.json
   ```

---

## 🔧 ROLLBACK TYPE 3: FULL SYSTEM ROLLBACK

**Use when**: Complete system failure

### Step 1: Render Service Rollback
1. **Access Render Dashboard**
   - Log into Render.com
   - Navigate to possue2-backend service
   - Click "Rollback" to previous stable deployment

### Step 2: Database Recovery (if needed)
- Follow Database Rollback procedures above
- Verify database connectivity after code rollback

### Step 3: Environment Variable Recovery
1. **Check Environment Variables**
   - Ensure `DATABASE_URL` still points to correct database
   - Verify all required environment variables are set
   - Restore any accidentally changed variables

### Step 4: Full System Verification
```bash
# Test all critical functionality
./scripts/post-deployment-verification.sh https://your-api-domain.com

# Test user registration flow
# Test email verification flow
# Test existing user login
```

---

## 🔍 TROUBLESHOOTING COMMON ISSUES

### Issue: "Cannot connect to database"
**Solution**:
1. Check `DATABASE_URL` in Render environment variables
2. Verify database service is running
3. Check for database connection limits

### Issue: "User count decreased after deployment"
**Solution**:
1. IMMEDIATELY stop all operations
2. Use Database Rollback procedures
3. Do NOT attempt to fix - restore from backup

### Issue: "Email verification not working"
**Solution**:
1. Check SendGrid API key in environment variables
2. Verify sender email is authenticated
3. Check email template file exists

### Issue: "Rate limiting errors"
**Solution**:
1. Check for import errors in auth-rate-limit.js
2. Verify middleware is correctly imported
3. Temporarily disable rate limiting if critical

---

## 📋 POST-ROLLBACK CHECKLIST

### Immediate Verification (Required)
- [ ] **API is responding** to basic requests
- [ ] **User login works** for existing users
- [ ] **User count matches** pre-deployment count
- [ ] **Database connectivity** is stable
- [ ] **Email system works** (if applicable)

### Within 1 Hour
- [ ] **Monitor error logs** for any ongoing issues
- [ ] **Test user registration** (if system allows)
- [ ] **Verify backup integrity** for future use
- [ ] **Document rollback reasons** and timeline

### Within 24 Hours
- [ ] **Investigate root cause** of deployment failure
- [ ] **Update procedures** to prevent recurrence
- [ ] **Plan corrected redeployment** strategy
- [ ] **Notify stakeholders** of status and timeline

---

## 📞 EMERGENCY CONTACTS

### Technical Issues
- **Primary Contact**: [Your contact information]
- **Database Issues**: [Database administrator contact]
- **Hosting Issues**: [Render.com support or account manager]

### Business Issues
- **System Owner**: [Business contact]
- **User Communications**: [Support team contact]

---

## 📝 INCIDENT DOCUMENTATION

**Incident Date**: ________________  
**Time Detected**: ________________  
**Detected By**: ________________  
**Issue Description**: 
_[Describe what went wrong]_

**Rollback Type Used**: ________________  
**Rollback Completed At**: ________________  
**Data Loss Detected**: YES / NO  
**User Impact**: ________________

### Recovery Steps Taken:
- [ ] Code rollback
- [ ] Database restore
- [ ] Environment variable fixes
- [ ] Other: ________________

### Verification Results:
- [ ] API functionality restored
- [ ] User data integrity confirmed
- [ ] Email system working
- [ ] No ongoing errors

**Final Status**: ✅ RECOVERED / ⚠️ PARTIAL / ❌ ONGOING ISSUES

### Lessons Learned:
_[What can be improved for next time]_

### Action Items:
1. _[Specific items to prevent recurrence]_
2. _[Process improvements needed]_
3. _[Additional safeguards to implement]_

---

## 🔄 PREVENTION FOR FUTURE DEPLOYMENTS

### Enhanced Safety Measures
1. **Always test on staging** environment first
2. **Double-check backup procedures** before deployment
3. **Verify migration scripts** on test database
4. **Have rollback plan ready** before starting deployment

### Monitoring Improvements
1. **Set up alerts** for database connection issues
2. **Monitor user registration rates** for anomalies
3. **Track error rates** continuously
4. **Automate backup verification** before deployments

### Process Improvements
1. **Mandatory staging deployment** before production
2. **Two-person approval** for database changes
3. **Automated rollback triggers** for critical failures
4. **Regular disaster recovery drills**

---

**🚨 REMEMBER: Speed is critical in data recovery. Act fast but follow procedures carefully.**

**📞 If in doubt, contact emergency support immediately.**