#!/bin/bash

# Sync New Essays Script
# Syncs only new essays from local to remote database

echo "🔄 Syncing new essays from local to remote..."

# Get the latest essay IDs from both databases
echo "📊 Checking essay status..."

# Get max ID from remote
REMOTE_MAX_ID=$(PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -t -c "SELECT COALESCE(MAX(id), 0) FROM essays;")

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
PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql \
    -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com \
    -p 5432 -U possue2_db_v5_user -d possue2_db_v5 < /tmp/new-essays.sql

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
    PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql \
        -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com \
        -p 5432 -U possue2_db_v5_user -d possue2_db_v5 < /tmp/new-essays-subjects.sql
    
    echo "✅ Essay relationships synced!"
    
    # Verify the sync
    echo ""
    echo "📊 Verification:"
    echo "Local essays:"
    PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "SELECT count(*) FROM essays WHERE published_at IS NOT NULL;"
    echo "Remote essays:"
    PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -t -c "SELECT count(*) FROM essays WHERE published_at IS NOT NULL;"
    
else
    echo "❌ Import failed!"
    exit 1
fi

# Cleanup
rm -f /tmp/new-essays.sql /tmp/new-essays-subjects.sql

echo ""
echo "✨ Sync completed! Remember to restart your remote Strapi instance."