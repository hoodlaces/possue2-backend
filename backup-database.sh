#!/bin/bash

# Database Backup Script for Strapi Marketplace v5
# Creates multiple backup formats with timestamps

DB_NAME="strapi-marketplace-v5"
DB_USER="postgres"
DB_HOST="127.0.0.1"
DB_PORT="5432"
BACKUP_DIR="/Users/Pantah/apps/possue2-backend/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "🔄 Creating database backups for $DB_NAME..."
echo "Timestamp: $TIMESTAMP"

# Use the correct PostgreSQL version from Postgres.app
PG_DUMP="/Applications/Postgres.app/Contents/Versions/17/bin/pg_dump"

# Check if pg_dump exists
if [ ! -f "$PG_DUMP" ]; then
    echo "❌ Error: pg_dump not found at $PG_DUMP"
    echo "Please update the PG_DUMP path in this script"
    exit 1
fi

# 1. Create SQL dump (plain text, human readable)
echo "📄 Creating SQL dump..."
$PG_DUMP -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME > "$BACKUP_DIR/${DB_NAME}-sql-${TIMESTAMP}.sql"

# 2. Create custom format backup (compressed, faster restore)
echo "📦 Creating custom format backup..."
$PG_DUMP -U $DB_USER -h $DB_HOST -p $DB_PORT --format=custom --compress=9 $DB_NAME > "$BACKUP_DIR/${DB_NAME}-custom-${TIMESTAMP}.backup"

# 3. Create directory format backup (parallel restore capable)
echo "📁 Creating directory format backup..."
mkdir -p "$BACKUP_DIR/${DB_NAME}-directory-${TIMESTAMP}"
$PG_DUMP -U $DB_USER -h $DB_HOST -p $DB_PORT --format=directory --compress=9 --jobs=4 $DB_NAME --file="$BACKUP_DIR/${DB_NAME}-directory-${TIMESTAMP}"

# 4. Compress the SQL dump
echo "🗜️  Compressing SQL dump..."
gzip "$BACKUP_DIR/${DB_NAME}-sql-${TIMESTAMP}.sql"

# 5. Create a data-only backup (useful for migrating just data)
echo "📊 Creating data-only backup..."
$PG_DUMP -U $DB_USER -h $DB_HOST -p $DB_PORT --data-only --format=custom --compress=9 $DB_NAME > "$BACKUP_DIR/${DB_NAME}-data-only-${TIMESTAMP}.backup"

# 6. Create schema-only backup (useful for recreating structure)
echo "🏗️  Creating schema-only backup..."
$PG_DUMP -U $DB_USER -h $DB_HOST -p $DB_PORT --schema-only $DB_NAME > "$BACKUP_DIR/${DB_NAME}-schema-only-${TIMESTAMP}.sql"
gzip "$BACKUP_DIR/${DB_NAME}-schema-only-${TIMESTAMP}.sql"

echo ""
echo "✅ Backup completed! Files created:"
echo "=================================="
ls -lah "$BACKUP_DIR"/*${TIMESTAMP}*

echo ""
echo "📋 Backup Types Created:"
echo "- SQL dump (compressed): ${DB_NAME}-sql-${TIMESTAMP}.sql.gz"
echo "- Custom format: ${DB_NAME}-custom-${TIMESTAMP}.backup"
echo "- Directory format: ${DB_NAME}-directory-${TIMESTAMP}/"
echo "- Data-only: ${DB_NAME}-data-only-${TIMESTAMP}.backup"
echo "- Schema-only: ${DB_NAME}-schema-only-${TIMESTAMP}.sql.gz"

echo ""
echo "🔧 Restoration Commands:"
echo "========================"
echo "SQL dump:     gunzip -c ${DB_NAME}-sql-${TIMESTAMP}.sql.gz | psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d NEW_DB_NAME"
echo "Custom:       pg_restore -U $DB_USER -h $DB_HOST -p $DB_PORT -d NEW_DB_NAME ${DB_NAME}-custom-${TIMESTAMP}.backup"
echo "Directory:    pg_restore -U $DB_USER -h $DB_HOST -p $DB_PORT -d NEW_DB_NAME ${DB_NAME}-directory-${TIMESTAMP}"

echo ""
echo "🎉 Backup process complete!"