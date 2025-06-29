#!/bin/bash

# Strapi Backup Script
# Creates a timestamped backup of your Strapi data

# Create backups directory if it doesn't exist
mkdir -p backups

# Generate timestamp for unique backup filename
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_NAME="strapi-backup-${TIMESTAMP}"

echo "Creating backup: ${BACKUP_NAME}..."

# Export data with compression but no encryption for easier use
npx strapi export -f "backups/${BACKUP_NAME}" --no-encrypt --verbose

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: backups/${BACKUP_NAME}.tar.gz"
    echo "📊 Backup contents include:"
    echo "   - All content (essays, answers, subjects)"
    echo "   - Configuration"
    echo "   - Relationships and links"
    echo "   - Upload files (where available)"
else
    echo "❌ Backup failed"
    exit 1
fi

# Optional: Clean up old backups (keep last 5)
echo "🧹 Cleaning up old backups (keeping last 5)..."
cd backups
ls -t strapi-backup-*.tar.gz | tail -n +6 | xargs rm -f
cd ..

echo "✨ Backup process complete!"