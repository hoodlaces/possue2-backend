# Database Backup & Restoration Guide

## 📦 Available Backup Types

Your database has been backed up in multiple formats for maximum flexibility:

### 1. **SQL Dump (Compressed)** - `strapi-marketplace-v5-sql-TIMESTAMP.sql.gz`
- **Best for**: Human-readable backups, version control, cross-platform compatibility
- **Size**: ~399KB (compressed)
- **Format**: Plain text SQL commands

### 2. **Custom Format** - `strapi-marketplace-v5-custom-TIMESTAMP.backup`
- **Best for**: Fast, efficient restoration with selective restore options
- **Size**: ~610KB
- **Format**: PostgreSQL custom binary format

### 3. **Directory Format** - `strapi-marketplace-v5-directory-TIMESTAMP/`
- **Best for**: Parallel restoration (fastest for large databases)
- **Size**: Multiple compressed files
- **Format**: Directory with compressed data files

### 4. **Data-Only** - `strapi-marketplace-v5-data-only-TIMESTAMP.backup`
- **Best for**: Migrating data to existing schema
- **Size**: ~414KB
- **Format**: Custom format with data only (no schema)

### 5. **Schema-Only** - `strapi-marketplace-v5-schema-only-TIMESTAMP.sql.gz`
- **Best for**: Recreating database structure without data
- **Size**: ~9KB
- **Format**: SQL commands for structure only

## 🔧 Restoration Methods

### Method 1: SQL Dump (Most Compatible)
```bash
# 1. Create new database
createdb -U postgres -h 127.0.0.1 -p 5432 strapi-marketplace-v5-restored

# 2. Restore from SQL dump
gunzip -c backups/strapi-marketplace-v5-sql-TIMESTAMP.sql.gz | psql -U postgres -h 127.0.0.1 -p 5432 -d strapi-marketplace-v5-restored
```

### Method 2: Custom Format (Recommended)
```bash
# 1. Create new database
createdb -U postgres -h 127.0.0.1 -p 5432 strapi-marketplace-v5-restored

# 2. Restore from custom backup (fastest, most reliable)
/Applications/Postgres.app/Contents/Versions/17/bin/pg_restore -U postgres -h 127.0.0.1 -p 5432 -d strapi-marketplace-v5-restored backups/strapi-marketplace-v5-custom-TIMESTAMP.backup
```

### Method 3: Directory Format (Fastest for large DBs)
```bash
# 1. Create new database
createdb -U postgres -h 127.0.0.1 -p 5432 strapi-marketplace-v5-restored

# 2. Restore from directory (uses parallel processing)
/Applications/Postgres.app/Contents/Versions/17/bin/pg_restore -U postgres -h 127.0.0.1 -p 5432 -d strapi-marketplace-v5-restored --jobs=4 backups/strapi-marketplace-v5-directory-TIMESTAMP
```

### Method 4: Replace Existing Database
```bash
# ⚠️  WARNING: This will completely replace your current database!

# 1. Drop existing database
dropdb -U postgres -h 127.0.0.1 -p 5432 strapi-marketplace-v5

# 2. Create fresh database
createdb -U postgres -h 127.0.0.1 -p 5432 strapi-marketplace-v5

# 3. Restore from backup
/Applications/Postgres.app/Contents/Versions/17/bin/pg_restore -U postgres -h 127.0.0.1 -p 5432 -d strapi-marketplace-v5 backups/strapi-marketplace-v5-custom-TIMESTAMP.backup
```

## 🚨 Emergency Quick Restore

If you need to quickly restore to a working state:

```bash
# Quick restore command (replace TIMESTAMP with your backup timestamp)
./restore-database.sh TIMESTAMP
```

## 📅 Creating New Backups

Run the backup script anytime:
```bash
./backup-database.sh
```

This creates a complete backup set with timestamp for easy identification.

## 🔍 Verifying Backups

To verify a backup is valid:

```bash
# Check SQL dump
gunzip -t backups/strapi-marketplace-v5-sql-TIMESTAMP.sql.gz

# Check custom format
/Applications/Postgres.app/Contents/Versions/17/bin/pg_restore --list backups/strapi-marketplace-v5-custom-TIMESTAMP.backup

# Check directory format
ls -la backups/strapi-marketplace-v5-directory-TIMESTAMP/
```

## 💾 What's Included in Your Backup

Your backup contains the complete Strapi v5 database with:

- ✅ **242 Essays** (with draft & published versions)
- ✅ **85 Answers** (with draft & published versions)
- ✅ **14 Subjects** (with draft & published versions)
- ✅ **9 Users**
- ✅ **308 Essay-Subject relationships** (properly linked)
- ✅ **85 Essay-Answer relationships** (properly linked)
- ✅ **All month/year fields** populated
- ✅ **All Strapi system tables** (admin users, permissions, etc.)
- ✅ **All indexes and constraints**

## 🔄 Automated Backup Schedule

Consider setting up automated backups with cron:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /Users/Pantah/apps/possue2-backend && ./backup-database.sh >> backup.log 2>&1
```

## 📁 Backup Storage

Current backups are stored in:
```
/Users/Pantah/apps/possue2-backend/backups/
```

Consider also:
- Copying to external drive
- Cloud storage (Google Drive, Dropbox)
- Version control system (for SQL dumps)

## 🆘 Troubleshooting

### If restoration fails:
1. Check PostgreSQL service is running
2. Verify database user permissions
3. Ensure target database exists and is empty
4. Check PostgreSQL version compatibility

### Common issues:
- **Permission denied**: Run with correct user (`-U postgres`)
- **Database exists**: Drop existing database first
- **Version mismatch**: Use correct pg_restore version from Postgres.app

---

## 📞 Support

If you encounter issues:
1. Check the error message carefully
2. Verify PostgreSQL is running: `brew services list | grep postgres`
3. Test connection: `psql -U postgres -h 127.0.0.1 -p 5432 -l`

Your database is now safely backed up with multiple restore options! 🎉