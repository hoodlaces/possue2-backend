# Strapi Backup & Restore Guide

This guide explains how to backup and restore your Strapi v5 application data using the built-in data management features.

## Overview

Your Strapi instance now has built-in backup capabilities using Strapi's native export/import system. This provides:

- ✅ **Content backup**: All essays, answers, subjects, and relationships
- ✅ **Configuration backup**: API settings, permissions, plugins
- ✅ **File compression**: Automatic gzip compression
- ✅ **Security**: Optional encryption support
- ✅ **Schema validation**: Ensures data compatibility

## Quick Start

### Create a Backup
```bash
# Using npm script (recommended)
npm run backup

# Or directly
npx strapi export -f "backup-$(date +%Y%m%d-%H%M%S)" --no-encrypt
```

### Restore from Backup
```bash
# Using npm script
npm run restore backups/strapi-backup-20231223-143022.tar.gz

# Or directly
npx strapi import -f backups/strapi-backup-20231223-143022.tar.gz --force
```

## Detailed Commands

### Export Options
```bash
# Basic export (no encryption, compressed)
npx strapi export -f my-backup --no-encrypt

# Export with encryption (will prompt for password)
npx strapi export -f my-backup

# Export only content (no config/files)
npx strapi export -f content-only --only content --no-encrypt

# Export excluding files
npx strapi export -f no-files --exclude files --no-encrypt

# Verbose output
npx strapi export -f my-backup --no-encrypt --verbose
```

### Import Options
```bash
# Basic import (will delete all existing data!)
npx strapi import -f my-backup.tar.gz --force

# Import only content
npx strapi import -f my-backup.tar.gz --only content --force

# Import excluding config
npx strapi import -f my-backup.tar.gz --exclude config --force
```

## Backup Scripts

Two convenience scripts are provided in the `scripts/` directory:

### `scripts/backup.sh`
- Creates timestamped backups in `backups/` directory
- Automatically cleans up old backups (keeps last 5)
- Uses compression but no encryption for easier use
- Provides detailed output

### `scripts/restore.sh`
- Interactive restore with safety confirmations
- Lists available backups if no file specified
- Provides clear warnings about data deletion

## Backup Contents

Your backups include:

| Type | Count | Description |
|------|-------|-------------|
| **Schemas** | 25 | Content types, components |
| **Entities** | 709 | Your content data |
| ├─ Essays | 484 | All essay content |
| ├─ Answers | 170 | All answer content |
| ├─ Subjects | 28 | All subject content |
| ├─ Users | 9 | User accounts |
| └─ Other | 18 | Files, permissions, etc. |
| **Links** | 1521 | Relationships between content |
| **Configuration** | 34 | API settings, permissions |

## Important Notes

### ⚠️ Data Deletion Warning
**The import command deletes ALL existing data** before importing the backup. This includes:
- All content (essays, answers, subjects)
- User accounts
- File uploads
- Configuration settings

### 🔐 Encryption
- Backups can be encrypted with AES-128-ECB
- Use `--no-encrypt` for unencrypted backups (easier for automation)
- Encrypted backups require a password during export and import

### 📁 File Handling
- Upload files are included in backups when available
- Missing files will cause warnings but won't stop the backup
- Large file uploads will increase backup size significantly

### 🚀 Production Use
For production environments:
1. **Stop your application** before restoring backups
2. **Test restores** in a staging environment first
3. **Use encrypted backups** for sensitive data
4. **Automate backups** with cron jobs or CI/CD

## Automation Examples

### Daily Backup Cron Job
```bash
# Add to crontab (crontab -e)
0 2 * * * cd /path/to/your/strapi && npm run backup
```

### Backup Before Deployments
```bash
# Add to your deployment script
echo "Creating pre-deployment backup..."
npm run backup
npm run build
# ... deploy
```

## Troubleshooting

### Common Issues

**Missing files during export:**
- Files referenced in database but missing from filesystem
- Safe to ignore - backup will continue without missing files

**Schema mismatch during import:**
- Source and target Strapi versions must match
- Content types must be identical between instances

**Permission errors:**
- Ensure write permissions for backups directory
- Scripts must be executable (`chmod +x scripts/*.sh`)

### Recovery Options

If import fails:
1. Check Strapi logs for detailed error messages
2. Verify backup file integrity
3. Ensure database is accessible
4. Try importing with `--exclude config` to skip configuration

## File Locations

```
your-strapi-project/
├── backups/                    # Backup files stored here
│   ├── strapi-backup-20231223-143022.tar.gz
│   └── strapi-backup-20231224-091515.tar.gz
├── scripts/
│   ├── backup.sh              # Backup script
│   └── restore.sh             # Restore script
└── BACKUP-GUIDE.md           # This documentation
```

## Support

For additional help:
- [Strapi v5 Data Management Documentation](https://docs.strapi.io/cms/features/data-management)
- [Strapi Community Forum](https://forum.strapi.io/)
- Check your `strapi.log` file for detailed error messages

---

**Last Updated:** December 2024 for Strapi v5.16.0