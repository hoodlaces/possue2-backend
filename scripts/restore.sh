#!/bin/bash

# Strapi Restore Script
# Restores data from a backup file
# ⚠️  WARNING: This will DELETE all existing data!

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup-file>"
    echo "Example: ./restore.sh backups/strapi-backup-20231223-143022.tar.gz"
    echo ""
    echo "Available backups:"
    ls -la backups/strapi-backup-*.tar.gz 2>/dev/null || echo "No backups found in backups/ directory"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will DELETE ALL existing data in your Strapi database!"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🔄 Starting restore from: $BACKUP_FILE"

# Import the data
npx strapi import -f "$BACKUP_FILE" --verbose --force

if [ $? -eq 0 ]; then
    echo "✅ Restore completed successfully!"
    echo "🚀 You may need to restart your Strapi server"
else
    echo "❌ Restore failed"
    exit 1
fi