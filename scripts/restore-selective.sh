#!/bin/bash

# Selective Restore Script
# Restores specific content types from selective backups

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <backup-type> <timestamp> [database-type]"
    echo ""
    echo "Backup types:"
    echo "  content          - Restore essays and answers"
    echo "  safety           - Restore users and subjects"
    echo "  relationships    - Restore relationship tables"
    echo "  all              - Restore all selective backup types"
    echo ""
    echo "Database types:"
    echo "  local            - Restore to local database (default)"
    echo "  remote           - Restore to remote database"
    echo ""
    echo "Example: $0 content 20231223-143022 local"
    echo "Example: $0 safety 20231223-143022 remote"
    echo ""
    echo "Available backups:"
    ls -la backups/selective/ 2>/dev/null | grep -E "(content|safety|relationships)" | head -10
    exit 1
fi

BACKUP_TYPE="$1"
TIMESTAMP="$2"
DATABASE_TYPE="${3:-local}"

# Function to restore specific backup file
restore_backup() {
    local backup_file=$1
    local description=$2
    
    if [ ! -f "$backup_file" ]; then
        echo "❌ Backup file not found: $backup_file"
        return 1
    fi
    
    echo "🔄 Restoring $description from: $backup_file"
    
    if [ "$DATABASE_TYPE" = "local" ]; then
        PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 < "$backup_file"
    else
        PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql \
            -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com \
            -p 5432 -U possue2_db_v5_user -d possue2_db_v5 < "$backup_file"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ $description restored successfully"
        return 0
    else
        echo "❌ $description restore failed"
        return 1
    fi
}

# Warning for remote database operations
if [ "$DATABASE_TYPE" = "remote" ]; then
    echo "⚠️  WARNING: You are about to restore to the REMOTE database!"
    echo "This will overwrite data on your production server."
    echo ""
    read -p "Are you absolutely sure you want to continue? (yes/no): " confirmation
    if [ "$confirmation" != "yes" ]; then
        echo "❌ Restore cancelled"
        exit 1
    fi
fi

echo "🔄 Starting selective restore..."
echo "Backup type: $BACKUP_TYPE"
echo "Timestamp: $TIMESTAMP"
echo "Database: $DATABASE_TYPE"
echo ""

case "$BACKUP_TYPE" in
    "content")
        echo "📝 Restoring CONTENT tables (essays & answers)..."
        restore_backup "backups/selective/content-essays-answers-${TIMESTAMP}.sql" "Essays and Answers"
        ;;
    "safety")
        echo "🛡️  Restoring SAFETY tables (users & subjects)..."
        restore_backup "backups/selective/safety-users-subjects-${TIMESTAMP}.sql" "Users and Subjects"
        ;;
    "relationships")
        echo "🔗 Restoring RELATIONSHIP tables..."
        restore_backup "backups/selective/relationships-${TIMESTAMP}.sql" "Relationships"
        ;;
    "all")
        echo "📦 Restoring ALL selective backup types..."
        echo ""
        echo "1️⃣ Restoring content..."
        restore_backup "backups/selective/content-essays-answers-${TIMESTAMP}.sql" "Essays and Answers"
        echo ""
        echo "2️⃣ Restoring safety..."
        restore_backup "backups/selective/safety-users-subjects-${TIMESTAMP}.sql" "Users and Subjects"
        echo ""
        echo "3️⃣ Restoring relationships..."
        restore_backup "backups/selective/relationships-${TIMESTAMP}.sql" "Relationships"
        ;;
    *)
        echo "❌ Invalid backup type: $BACKUP_TYPE"
        echo "Valid types: content, safety, relationships, all"
        exit 1
        ;;
esac

# Show manifest if available
MANIFEST_FILE="backups/selective/manifest-${TIMESTAMP}.txt"
if [ -f "$MANIFEST_FILE" ]; then
    echo ""
    echo "📋 Backup manifest:"
    echo "==================="
    cat "$MANIFEST_FILE"
fi

echo ""
echo "✨ Selective restore completed!"
echo ""
echo "🚀 You may need to restart your Strapi server to see changes"
if [ "$DATABASE_TYPE" = "remote" ]; then
    echo "☁️  Remember to restart your remote Strapi instance"
fi