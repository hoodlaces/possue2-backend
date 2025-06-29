#!/bin/bash

# Selective Backup Script for Content Sync
# Creates targeted backups for essays, answers, and safety backups for users/subjects

# Check if required environment variables are set
if [ -z "$DATABASE_PASSWORD" ]; then
    echo "❌ ERROR: DATABASE_PASSWORD environment variable is required"
    echo "Please set your database password: export DATABASE_PASSWORD=your_password"
    exit 1
fi

# Set default values for database connection
DATABASE_HOST=${DATABASE_HOST:-"dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com"}
DATABASE_PORT=${DATABASE_PORT:-"5432"}
DATABASE_NAME=${DATABASE_NAME:-"possue2_db_v5"}
DATABASE_USERNAME=${DATABASE_USERNAME:-"possue2_db_v5_user"}

# Create backups directory if it doesn't exist
mkdir -p backups/selective

# Generate timestamp for unique backup filename
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

echo "🔒 Creating selective backups for content sync..."

# Function to backup specific database tables
backup_tables() {
    local backup_name=$1
    shift
    local tables=("$@")
    
    echo "📦 Backing up tables: ${tables[*]}"
    
    # For local database
    if [ "$DATABASE_TYPE" = "local" ]; then
        PGPASSWORD=1212 /Applications/Postgres.app/Contents/Versions/17/bin/pg_dump \
            -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 \
            --data-only \
            $(printf -- "-t %s " "${tables[@]}") \
            > "backups/selective/${backup_name}-${TIMESTAMP}.sql"
    else
        # For remote database
        PGPASSWORD=$DATABASE_PASSWORD pg_dump \
            -h $DATABASE_HOST \
            -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME \
            --data-only \
            $(printf -- "-t %s " "${tables[@]}") \
            > "backups/selective/${backup_name}-${TIMESTAMP}.sql"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ ${backup_name} backup completed: backups/selective/${backup_name}-${TIMESTAMP}.sql"
    else
        echo "❌ ${backup_name} backup failed"
        return 1
    fi
}

# Set database type (local or remote)
DATABASE_TYPE=${1:-"local"}

if [ "$DATABASE_TYPE" = "local" ]; then
    echo "🏠 Backing up LOCAL database tables..."
elif [ "$DATABASE_TYPE" = "remote" ]; then
    echo "☁️  Backing up REMOTE database tables..."
else
    echo "Usage: $0 [local|remote]"
    echo "Example: $0 local"
    echo "Example: $0 remote"
    exit 1
fi

# Backup essays and answers (content to be synced)
echo ""
echo "📝 Backing up CONTENT tables (essays & answers)..."
backup_tables "content-essays-answers" \
    "essays" "essays_cmps" "essays_subjects_lnk" "essays_answer_lnk" \
    "answers" "answers_cmps"

# Backup users and subjects (safety backup - should NOT be overwritten)
echo ""
echo "🛡️  Backing up SAFETY tables (users & subjects)..."
backup_tables "safety-users-subjects" \
    "admin_users" "admin_users_roles_lnk" "admin_roles" "admin_permissions" "admin_permissions_role_lnk" \
    "up_users" "up_users_role_lnk" "up_roles" "up_permissions" "up_permissions_role_lnk" \
    "subjects" "subjects_cmps"

# Backup relationships and components
echo ""
echo "🔗 Backing up RELATIONSHIP tables..."
backup_tables "relationships" \
    "components_shared_seos" "components_shared_seos_cmps" "components_shared_meta_socials"

# Create a manifest file
echo ""
echo "📋 Creating backup manifest..."
cat > "backups/selective/manifest-${TIMESTAMP}.txt" << EOF
Selective Backup Manifest
========================
Timestamp: ${TIMESTAMP}
Database: ${DATABASE_TYPE}
Created: $(date)

Content Tables (for sync):
- essays, essays_cmps, essays_subjects_lnk, essays_answer_lnk
- answers, answers_cmps

Safety Tables (preserve these):
- admin_users, admin_users_roles_lnk, admin_roles, admin_permissions, admin_permissions_role_lnk
- up_users, up_users_role_lnk, up_roles, up_permissions, up_permissions_role_lnk
- subjects, subjects_cmps

Relationship Tables:
- components_shared_seos, components_shared_seos_cmps, components_shared_meta_socials

Backup Files:
- content-essays-answers-${TIMESTAMP}.sql
- safety-users-subjects-${TIMESTAMP}.sql
- relationships-${TIMESTAMP}.sql
EOF

echo "✅ Backup manifest created: backups/selective/manifest-${TIMESTAMP}.txt"

# Cleanup old selective backups (keep last 3)
echo ""
echo "🧹 Cleaning up old selective backups (keeping last 3)..."
cd "backups/selective"
ls -t content-essays-answers-*.sql 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null
ls -t safety-users-subjects-*.sql 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null
ls -t relationships-*.sql 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null
ls -t manifest-*.txt 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null
cd - > /dev/null

echo ""
echo "✨ Selective backup process complete!"
echo ""
echo "📁 Backup files located in: backups/selective/"
echo "🔖 Manifest file: manifest-${TIMESTAMP}.txt"
echo ""
echo "Next steps:"
echo "1. Use import/export plugin to sync essays & answers"
echo "2. Keep safety backups for rollback if needed"
echo "3. Verify user and subject data remains unchanged"