#!/bin/bash

# Complete Essay Sync Script
# Syncs ALL missing essays (draft + published pairs) from local to remote database
# Goal: Match local published count (258) on remote

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

echo "🔄 Complete Essay Sync - Draft + Published Pairs"
echo "================================================"

# Get current counts
echo "📊 Current Status:"
LOCAL_TOTAL=$(PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "SELECT COUNT(*) FROM essays;")
LOCAL_PUBLISHED=$(PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "SELECT COUNT(*) FROM essays WHERE published_at IS NOT NULL;")
REMOTE_TOTAL=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME -t -c "SELECT COUNT(*) FROM essays;")
REMOTE_PUBLISHED=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME -t -c "SELECT COUNT(*) FROM essays WHERE published_at IS NOT NULL;")

echo "Local:  $LOCAL_TOTAL total ($LOCAL_PUBLISHED published)"
echo "Remote: $REMOTE_TOTAL total ($REMOTE_PUBLISHED published)"
echo "Gap:    $(($LOCAL_TOTAL - $REMOTE_TOTAL)) total, $(($LOCAL_PUBLISHED - $REMOTE_PUBLISHED)) published"

# Find missing essays by comparing local vs remote IDs
echo ""
echo "🔍 Finding missing essays..."

# Get all local essay IDs
PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "SELECT id FROM essays ORDER BY id;" > /tmp/local_essay_ids.txt

# Get all remote essay IDs  
PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME -t -c "SELECT id FROM essays ORDER BY id;" > /tmp/remote_essay_ids.txt

# Find missing IDs
comm -23 <(sort /tmp/local_essay_ids.txt) <(sort /tmp/remote_essay_ids.txt) > /tmp/missing_essay_ids.txt

MISSING_COUNT=$(wc -l < /tmp/missing_essay_ids.txt | tr -d ' ')
echo "Found $MISSING_COUNT essays missing from remote"

if [ "$MISSING_COUNT" -eq "0" ]; then
    echo "✅ All essays already exist in remote!"
    exit 0
fi

# Show preview of missing essays
echo ""
echo "Preview of missing essays (first 10):"
head -10 /tmp/missing_essay_ids.txt | while read essay_id; do
    if [ ! -z "$essay_id" ]; then
        PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -c "
            SELECT id, title, published_at IS NOT NULL as is_published, document_id
            FROM essays 
            WHERE id = $essay_id;"
    fi
done

echo ""
read -p "Do you want to sync ALL missing essays to remote? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Sync cancelled"
    exit 1
fi

# Get the next available ID from remote to avoid conflicts
NEXT_REMOTE_ID=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME -t -c "SELECT COALESCE(MAX(id), 0) + 1 FROM essays;")
echo "🆔 Next available remote ID: $NEXT_REMOTE_ID"

# Export ALL essays that don't exist in remote, reassigning IDs
echo "🚀 Exporting missing essays with new IDs..."

# Create the export with ID remapping - process missing essays in batches
echo "📝 Creating INSERT statements for missing essays..."

# Clear the output file
> /tmp/complete-essays-sync.sql

# Process missing essays from the ID list
counter=0
while read essay_id; do
    if [ ! -z "$essay_id" ]; then
        new_id=$(($NEXT_REMOTE_ID + $counter))
        
        # Generate INSERT statement for this essay
        PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "
            SELECT 'INSERT INTO essays (id, title, content, month, year, published_at, created_at, updated_at, document_id, locale) VALUES (' ||
                   $new_id || ', ' ||
                   quote_literal(title) || ', ' ||
                   quote_literal(content) || ', ' ||
                   quote_literal(month) || ', ' ||
                   year || ', ' ||
                   COALESCE(quote_literal(published_at::text), 'NULL') || ', ' ||
                   quote_literal(created_at::text) || ', ' ||
                   quote_literal(updated_at::text) || ', ' ||
                   quote_literal(document_id) || ', ' ||
                   COALESCE(quote_literal(locale), 'NULL') || ');'
            FROM essays WHERE id = $essay_id;" >> /tmp/complete-essays-sync.sql
        
        counter=$((counter + 1))
        
        # Show progress every 10 essays
        if [ $((counter % 10)) -eq 0 ]; then
            echo "Processed $counter essays..."
        fi
    fi
done < /tmp/missing_essay_ids.txt

echo "Generated INSERT statements for $counter essays"

# Count how many we're syncing
SYNC_COUNT=$(wc -l < /tmp/complete-essays-sync.sql | tr -d ' ')
echo "📝 Prepared $SYNC_COUNT essays for sync"

# Import to remote
echo "🚀 Importing essays to remote database..."
PGPASSWORD=$DATABASE_PASSWORD psql \
    -h $DATABASE_HOST \
    -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME \
    -f /tmp/complete-essays-sync.sql

if [ $? -eq 0 ]; then
    echo "✅ Essays imported successfully!"
    
    # Verify final counts
    echo ""
    echo "📊 Final Verification:"
    FINAL_REMOTE_TOTAL=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME -t -c "SELECT COUNT(*) FROM essays;")
    FINAL_REMOTE_PUBLISHED=$(PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USERNAME -d $DATABASE_NAME -t -c "SELECT COUNT(*) FROM essays WHERE published_at IS NOT NULL;")
    
    echo "Local:  $LOCAL_TOTAL total ($LOCAL_PUBLISHED published)"
    echo "Remote: $FINAL_REMOTE_TOTAL total ($FINAL_REMOTE_PUBLISHED published)"
    
    if [ "$LOCAL_PUBLISHED" -eq "$FINAL_REMOTE_PUBLISHED" ]; then
        echo "🎉 SUCCESS! Published counts now match!"
    else
        echo "⚠️  Published counts still don't match. May need manual review."
    fi
    
else
    echo "❌ Import failed!"
    exit 1
fi

# Cleanup
rm -f /tmp/local_essay_ids.txt /tmp/remote_essay_ids.txt /tmp/missing_essay_ids.txt /tmp/complete-essays-sync.sql

echo ""
echo "✨ Complete sync finished! Remember to restart your remote Strapi instance."