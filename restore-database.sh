#!/bin/bash

# Quick Database Restoration Script
# Usage: ./restore-database.sh TIMESTAMP [new_db_name]

if [ -z "$1" ]; then
    echo "❌ Error: Please provide a timestamp"
    echo "Usage: $0 TIMESTAMP [new_db_name]"
    echo ""
    echo "Available backups:"
    ls -1 backups/*custom*.backup | sed 's/.*custom-\(.*\)\.backup/\1/'
    exit 1
fi

TIMESTAMP=$1
NEW_DB_NAME=${2:-"strapi-marketplace-v5-restored"}
BACKUP_DIR="/Users/Pantah/apps/possue2-backend/backups"
CUSTOM_BACKUP="$BACKUP_DIR/strapi-marketplace-v5-custom-${TIMESTAMP}.backup"
PG_RESTORE="/Applications/Postgres.app/Contents/Versions/17/bin/pg_restore"

# Check if backup exists
if [ ! -f "$CUSTOM_BACKUP" ]; then
    echo "❌ Error: Backup not found: $CUSTOM_BACKUP"
    echo ""
    echo "Available backups:"
    ls -1 "$BACKUP_DIR"/*custom*.backup 2>/dev/null | sed 's/.*custom-\(.*\)\.backup/\1/' || echo "No backups found"
    exit 1
fi

echo "🔄 Restoring database from backup..."
echo "Timestamp: $TIMESTAMP"
echo "Target database: $NEW_DB_NAME"
echo "Backup file: $CUSTOM_BACKUP"

# Create new database
echo "📦 Creating database: $NEW_DB_NAME"
createdb -U postgres -h 127.0.0.1 -p 5432 "$NEW_DB_NAME"

if [ $? -ne 0 ]; then
    echo "❌ Failed to create database. It may already exist."
    read -p "Do you want to drop and recreate it? (y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo "🗑️  Dropping existing database..."
        dropdb -U postgres -h 127.0.0.1 -p 5432 "$NEW_DB_NAME"
        echo "📦 Creating database: $NEW_DB_NAME"
        createdb -U postgres -h 127.0.0.1 -p 5432 "$NEW_DB_NAME"
    else
        echo "❌ Restoration cancelled"
        exit 1
    fi
fi

# Restore from backup
echo "♻️  Restoring data..."
$PG_RESTORE -U postgres -h 127.0.0.1 -p 5432 -d "$NEW_DB_NAME" "$CUSTOM_BACKUP"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database restored successfully!"
    echo "Database name: $NEW_DB_NAME"
    echo ""
    echo "🔧 To use this database with Strapi:"
    echo "1. Update your .env file:"
    echo "   DATABASE_NAME=$NEW_DB_NAME"
    echo ""
    echo "2. Or update config/database.js to point to: $NEW_DB_NAME"
    echo ""
    echo "📊 Restored content:"
    psql -U postgres -h 127.0.0.1 -p 5432 -d "$NEW_DB_NAME" -c "
        SELECT 
            'Essays' as type, COUNT(DISTINCT document_id) as documents 
        FROM essays 
        UNION ALL 
        SELECT 
            'Answers' as type, COUNT(DISTINCT document_id) as documents 
        FROM answers 
        UNION ALL 
        SELECT 
            'Subjects' as type, COUNT(DISTINCT document_id) as documents 
        FROM subjects;
    "
else
    echo "❌ Restoration failed!"
    exit 1
fi