#!/bin/bash

# Sync New Essays Script
# Syncs only new essays from local to remote database

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

echo "🔄 Syncing new essays from local to remote..."

# Get the latest essay IDs from both databases
echo "📊 Checking essay status..."

# Get max ID from remote
REMOTE_MAX_ID=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME -t -c "SELECT COALESCE(MAX(id), 0) FROM essays;")

# Get new essays from local (IDs greater than remote max)
echo "🔍 Finding new essays with ID > $REMOTE_MAX_ID"

# Create temporary export of new essays only
PGPASSWORD=1212 /Applications/Postgres.app/Contents/Versions/17/bin/pg_dump \
    -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 \
    --data-only \
    -t essays \
    --where="id > $REMOTE_MAX_ID" \
    > /tmp/new-essays.sql

# Count new essays
NEW_COUNT=$(grep -c "INSERT INTO" /tmp/new-essays.sql 2>/dev/null || echo "0")
echo "📝 Found $NEW_COUNT new essays to sync"

if [ "$NEW_COUNT" -eq "0" ]; then
    echo "✅ No new essays to sync - databases are already in sync!"
    exit 0
fi

# Show preview of new essays
echo ""
echo "Preview of new essays:"
PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -c "SELECT id, title, month, year, published_at IS NOT NULL as is_published FROM essays WHERE id > $REMOTE_MAX_ID ORDER BY id;"

echo ""
read -p "Do you want to sync these new essays to remote? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Sync cancelled"
    exit 1
fi

# Import new essays to remote
echo "🚀 Importing new essays to remote database..."
PGPASSWORD=$DATABASE_PASSWORD psql \
    -h $DATABASE_HOST \
    -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME < /tmp/new-essays.sql

if [ $? -eq 0 ]; then
    echo "✅ New essays imported successfully!"
    
    # Also sync related data
    echo "🔗 Syncing essay relationships..."
    
    # Export essay_subjects_lnk for new essays
    PGPASSWORD=1212 /Applications/Postgres.app/Contents/Versions/17/bin/pg_dump \
        -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 \
        --data-only \
        -t essays_subjects_lnk \
        --where="essay_id > $REMOTE_MAX_ID" \
        > /tmp/new-essays-subjects.sql
    
    # Import relationships
    PGPASSWORD=$DATABASE_PASSWORD psql \
        -h $DATABASE_HOST \
        -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME < /tmp/new-essays-subjects.sql
    
    echo "✅ Essay relationships synced!"
    
    # Verify the sync
    echo ""
    echo "📊 Verification:"
    echo "Local essays:"
    PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "SELECT count(*) FROM essays WHERE published_at IS NOT NULL;"
    echo "Remote essays:"
    PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME -t -c "SELECT count(*) FROM essays WHERE published_at IS NOT NULL;"
    
else
    echo "❌ Import failed!"
    exit 1
fi

# Cleanup
rm -f /tmp/new-essays.sql /tmp/new-essays-subjects.sql

echo ""
echo "✨ Sync completed! Remember to restart your remote Strapi instance."