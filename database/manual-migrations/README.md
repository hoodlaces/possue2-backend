# Manual Database Migrations

## Overview
This directory contains database migration scripts that must be run manually **before** deploying schema changes to production.

**IMPORTANT**: These scripts are **NOT** automatically executed by Strapi. They must be run manually as part of the deployment process.

## Why Manual Migrations?
- **Safety**: Manual execution ensures careful review and backup before changes
- **User Data Protection**: Prevents accidental data loss from automatic migrations  
- **Production Control**: Allows for database changes during planned maintenance windows
- **Rollback Safety**: Each migration has corresponding rollback procedures

## Available Migrations

### 000-create-migration-log.sql
**Purpose**: Creates the `migration_log` table to track manual migrations
**When to run**: Before any other manual migrations
**Safety**: Creates table only if it doesn't exist (idempotent)

### 001-add-email-verification-fields.sql  
**Purpose**: Adds email verification fields to the `up_users` table
- `confirmation_token_expiry` (TIMESTAMP WITH TIME ZONE)
- `email_verified_at` (TIMESTAMP WITH TIME ZONE)
**When to run**: Before deploying email verification system
**Safety**: Only adds fields, never removes existing data

## How to Run Migrations

### Prerequisites
1. **ALWAYS** run pre-deployment backup first:
   ```bash
   ./scripts/pre-deployment-backup.sh
   ```

2. **Verify** you have database access:
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

### Execution Process
1. **Connect to production database**:
   ```bash
   psql $DATABASE_URL
   ```

2. **Run migrations in order**:
   ```sql
   -- First, create migration log table
   \i database/manual-migrations/000-create-migration-log.sql
   
   -- Then run specific migrations as needed
   \i database/manual-migrations/001-add-email-verification-fields.sql
   ```

3. **Verify migration success**:
   ```sql
   -- Check migration log
   SELECT * FROM migration_log ORDER BY started_at DESC;
   
   -- Verify new columns exist
   \d up_users
   ```

### Alternative: File-based Execution
```bash
# Run from project root
psql $DATABASE_URL -f database/manual-migrations/000-create-migration-log.sql
psql $DATABASE_URL -f database/manual-migrations/001-add-email-verification-fields.sql
```

## Safety Features

### Built-in Safety Checks
- **Idempotent**: Can be run multiple times safely
- **Existence checks**: Only creates/modifies if needed
- **Transaction safety**: Uses BEGIN/COMMIT for atomicity
- **Progress logging**: Tracks migration status
- **Data preservation**: Never removes existing data

### Migration Log Tracking
Each migration records:
- Migration name and start time
- Completion status and timestamp
- Error information if failed
- User count before/after (for verification)

### Rollback Procedures
- Each migration can be rolled back if needed
- See `EMERGENCY-ROLLBACK-PROCEDURES.md` for details
- Always backup before running migrations

## Production Deployment Checklist

1. **Pre-Deployment**:
   - [ ] Run backup verification script
   - [ ] Review migration scripts
   - [ ] Plan maintenance window if needed

2. **Migration Execution**:
   - [ ] Connect to production database
   - [ ] Run migrations in correct order
   - [ ] Verify success in migration_log table
   - [ ] Test database connectivity

3. **Post-Deployment**:
   - [ ] Deploy Strapi application
   - [ ] Run post-deployment verification
   - [ ] Monitor for 24 hours

## Troubleshooting

### Common Issues

**Error: "relation migration_log does not exist"**
- Solution: Run `000-create-migration-log.sql` first

**Error: "column already exists"**  
- This is normal - migration is idempotent and will skip existing columns

**Connection issues**
- Verify DATABASE_URL is correct
- Check database server status
- Ensure network connectivity

### Emergency Procedures
If anything goes wrong:
1. **STOP** immediately
2. Follow `EMERGENCY-ROLLBACK-PROCEDURES.md`
3. Restore from pre-deployment backup
4. Investigate issue before retry

## Contact Information
- **Database Issues**: [Your contact]
- **Emergency Rollback**: [Emergency contact]
- **Deployment Questions**: [Team contact]

---

**⚠️ REMEMBER**: Always backup before running migrations. User data is irreplaceable.