# Selective Content Sync Guide

## Overview

This guide explains how to safely sync only essays and answers from your local database to the live site without overwriting users, subjects, or other existing data.

## Problem Solved

You want to:
- ✅ Upload new essays and answers to local database
- ✅ Push only those essays/answers to production
- ❌ **NOT** overwrite users, subjects, or other existing data

## Solution Architecture

### Tools Installed
1. **strapi-import-export** plugin for Strapi v5
2. **Selective backup scripts** for targeted data safety
3. **Enhanced package.json commands** for easy operation

### Safety-First Approach
- **Targeted backups** before any sync operation
- **Non-destructive imports** using the plugin
- **Rollback capabilities** for emergency recovery

## Quick Start

### 1. Create Safety Backups

**Before doing ANY sync operation:**

```bash
# Backup local database (before adding new content)
npm run backup:selective local

# Backup remote database (before sync)
npm run backup:selective remote
```

### 2. Add Content Locally
- Add your new essays and answers to local Strapi
- Test and verify the content

### 3. Use Import/Export Plugin
- Access Strapi admin at `/dashboard`
- Navigate to Import/Export plugin
- Export only essays and answers from local
- Import to remote (non-destructive)

### 4. Verify & Rollback if Needed
```bash
# If something goes wrong, restore from backup
npm run restore:selective safety [timestamp] remote
```

## Detailed Instructions

### Selective Backup Commands

#### Create Targeted Backups
```bash
# Backup local database tables
npm run backup:selective local

# Backup remote database tables  
npm run backup:selective remote
```

**What gets backed up:**
- **Content tables**: essays, answers, and their relationships
- **Safety tables**: users, admin accounts, subjects
- **Relationship tables**: components and links

#### Restore from Backups
```bash
# Restore specific backup type
npm run restore:selective <type> <timestamp> [database]

# Examples:
npm run restore:selective content 20231223-143022 local
npm run restore:selective safety 20231223-143022 remote
npm run restore:selective all 20231223-143022 local
```

**Restore types:**
- `content` - Essays and answers only
- `safety` - Users and subjects only
- `relationships` - Component relationships
- `all` - Everything from that backup

### Import/Export Plugin Usage

#### Admin Panel Access
1. Start your Strapi server: `npm run develop`
2. Go to admin dashboard: `http://localhost:1337/dashboard`
3. Look for "Import/Export" in the sidebar

#### Export Essays & Answers
1. Select **Export** from the plugin
2. Choose content types:
   - ✅ `api::essay.essay`
   - ✅ `api::answer.answer`
   - ❌ `api::subject.subject` (skip)
   - ❌ Admin users (skip)
3. Download the export file

#### Import to Remote
1. Access remote Strapi admin
2. Select **Import** from the plugin
3. Upload the export file
4. Choose **non-destructive** import mode
5. Verify the import completed successfully

## File Structure

```
your-strapi-project/
├── backups/
│   ├── selective/              # Targeted backup files
│   │   ├── content-essays-answers-20231223-143022.sql
│   │   ├── safety-users-subjects-20231223-143022.sql
│   │   ├── relationships-20231223-143022.sql
│   │   └── manifest-20231223-143022.txt
│   └── strapi-backup-*.tar.gz  # Full Strapi backups
├── scripts/
│   ├── backup-selective.sh     # Selective backup script
│   ├── restore-selective.sh    # Selective restore script
│   ├── backup.sh               # Full backup script
│   └── restore.sh              # Full restore script
└── SELECTIVE-SYNC-GUIDE.md     # This guide
```

## Safety Features

### Multiple Backup Types
- **Content backups**: Only essays/answers for sync
- **Safety backups**: Users/subjects for protection
- **Relationship backups**: Components and links
- **Full backups**: Complete Strapi exports

### Non-Destructive Imports
- Plugin imports **ADD** content, doesn't delete existing
- Users and subjects remain untouched
- Admin accounts preserved
- Permissions unchanged

### Rollback Protection
- Timestamped backups for point-in-time recovery
- Selective restore by content type
- Emergency full restore available

## Workflow Example

### Complete Sync Workflow

```bash
# 1. Create safety backup of remote (before sync)
npm run backup:selective remote

# 2. Add new essays/answers to local Strapi
# (Use admin panel to add content)

# 3. Create backup of local with new content
npm run backup:selective local

# 4. Use Import/Export plugin to sync
# - Export essays/answers from local admin
# - Import to remote admin (non-destructive)

# 5. Verify sync was successful
# - Check remote admin for new content
# - Verify users/subjects unchanged

# 6. If problems occur, rollback:
npm run restore:selective safety [timestamp] remote
```

### Emergency Recovery

If sync goes wrong:

```bash
# 1. Stop remote Strapi server

# 2. Restore users and subjects from safety backup
npm run restore:selective safety [timestamp] remote

# 3. Restore content from last known good backup
npm run restore:selective content [timestamp] remote

# 4. Restart remote Strapi server

# 5. Verify everything is back to working state
```

## Database Table Reference

### Content Tables (Safe to Sync)
```
essays                    # Essay content
essays_cmps              # Essay components
essays_subjects_lnk      # Essay-subject relationships
essays_answer_lnk        # Essay-answer relationships
answers                  # Answer content
answers_cmps             # Answer components
```

### Safety Tables (Never Overwrite)
```
# Admin Users
admin_users              # Admin accounts
admin_users_roles_lnk    # Admin role assignments
admin_roles              # Admin roles
admin_permissions        # Admin permissions
admin_permissions_role_lnk # Admin permission assignments

# Frontend Users
up_users                 # Public user accounts
up_users_role_lnk        # User role assignments
up_roles                 # User roles
up_permissions           # User permissions
up_permissions_role_lnk  # User permission assignments

# Subjects
subjects                 # Subject content
subjects_cmps            # Subject components
```

### Relationship Tables
```
components_shared_seos           # SEO components
components_shared_seos_cmps      # SEO component links
components_shared_meta_socials   # Social media components
```

## Plugin Configuration

Located in `config/plugins.js`:

```javascript
"strapi-import-export": {
  enabled: true,
  config: {
    // Plugin automatically provides UI in admin panel
    // No additional configuration needed for basic usage
  },
}
```

## Troubleshooting

### Common Issues

**Plugin not visible in admin:**
- Ensure plugin is installed: `yarn list strapi-import-export`
- Rebuild admin: `npm run build`
- Clear browser cache

**Backup script fails:**
- Check database connection credentials
- Ensure PostgreSQL tools are available
- Verify database permissions

**Import fails:**
- Check file format compatibility
- Ensure content types exist on target
- Verify no schema mismatches

**Circular foreign key warnings:**
- Normal for Strapi databases
- Backups will still work correctly
- Use `--disable-triggers` if needed

### Best Practices

1. **Always backup before sync operations**
2. **Test imports on staging first**
3. **Verify user/subject data after sync**
4. **Keep multiple backup versions**
5. **Document any custom relationships**

## Support

### Documentation Links
- [Strapi Import/Export Plugin](https://www.npmjs.com/package/strapi-import-export)
- [Strapi v5 Data Management](https://docs.strapi.io/cms/features/data-management)
- [PostgreSQL Backup/Restore](https://www.postgresql.org/docs/current/backup.html)

### Emergency Contacts
- Check `strapi.log` for detailed error messages
- Review backup manifest files for restore points
- Use full Strapi backups as last resort

---

**Last Updated:** December 2024 for Strapi v5.16.0  
**Plugin Version:** strapi-import-export@0.0.1  
**Dependencies:** PostgreSQL, Strapi v5, Node.js