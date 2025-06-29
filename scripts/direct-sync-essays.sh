#!/bin/bash

# Direct SQL Sync for New Essays
# Safely syncs specific new essays to remote database

echo "🔄 Starting direct sync of new essays..."

# Create temporary SQL file for new essays
TEMP_SQL="/tmp/sync-new-essays.sql"

echo "📝 Generating SQL for new essays..."

# Extract the new essays data
PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "
COPY (
    SELECT 
        'INSERT INTO essays (id, document_id, title, content, slug, month, year, locale, published_at, created_at, created_by_id, updated_at, updated_by_id) VALUES (' ||
        id || ', ' ||
        quote_literal(document_id) || ', ' ||
        quote_literal(title) || ', ' ||
        quote_literal(content) || ', ' ||
        quote_literal(slug) || ', ' ||
        quote_literal(month) || ', ' ||
        quote_literal(year) || ', ' ||
        COALESCE(quote_literal(locale), 'NULL') || ', ' ||
        COALESCE(quote_literal(published_at), 'NULL') || ', ' ||
        quote_literal(created_at) || ', ' ||
        COALESCE(created_by_id::text, 'NULL') || ', ' ||
        quote_literal(updated_at) || ', ' ||
        COALESCE(updated_by_id::text, 'NULL') || ');'
    FROM essays 
    WHERE id IN (1943, 1944, 1945)
    ORDER BY id
) TO STDOUT;
" > "$TEMP_SQL"

# Add essay-subject relationships
echo "" >> "$TEMP_SQL"
echo "-- Essay-Subject relationships" >> "$TEMP_SQL"

PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "
COPY (
    SELECT 
        'INSERT INTO essays_subjects_lnk (id, essay_id, subject_id, subject_ord, essay_ord) VALUES (' ||
        id || ', ' ||
        essay_id || ', ' ||
        subject_id || ', ' ||
        COALESCE(subject_ord, 0) || ', ' ||
        COALESCE(essay_ord, 0) || ');'
    FROM essays_subjects_lnk 
    WHERE essay_id IN (1943, 1944, 1945)
    ORDER BY id
) TO STDOUT;
" >> "$TEMP_SQL"

# Add essay components if any
echo "" >> "$TEMP_SQL"
echo "-- Essay components" >> "$TEMP_SQL"

PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "
COPY (
    SELECT 
        'INSERT INTO essays_cmps (id, entity_id, cmp_id, component_type, field, \"order\") VALUES (' ||
        id || ', ' ||
        entity_id || ', ' ||
        cmp_id || ', ' ||
        quote_literal(component_type) || ', ' ||
        quote_literal(field) || ', ' ||
        COALESCE(\"order\", 0) || ');'
    FROM essays_cmps 
    WHERE entity_id IN (1943, 1944, 1945)
    ORDER BY id
) TO STDOUT;
" >> "$TEMP_SQL"

# Update sequences
echo "" >> "$TEMP_SQL"
echo "-- Update sequences" >> "$TEMP_SQL"
echo "SELECT setval('essays_id_seq', (SELECT MAX(id) FROM essays));" >> "$TEMP_SQL"
echo "SELECT setval('essays_subjects_lnk_id_seq', (SELECT MAX(id) FROM essays_subjects_lnk));" >> "$TEMP_SQL"
echo "SELECT setval('essays_cmps_id_seq', (SELECT MAX(id) FROM essays_cmps));" >> "$TEMP_SQL"

echo "📋 Preview of sync SQL:"
echo "======================"
head -n 10 "$TEMP_SQL"
echo "..."
echo "======================"
echo ""

# Show what will be synced
echo "📊 Essays to be synced:"
PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -c "
SELECT id, title, month, year, 
       CASE WHEN published_at IS NOT NULL THEN 'Published' ELSE 'Draft' END as status
FROM essays 
WHERE id IN (1943, 1944, 1945) 
ORDER BY id;
"

echo ""
read -p "Do you want to proceed with syncing these essays to remote? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Sync cancelled"
    rm -f "$TEMP_SQL"
    exit 1
fi

echo ""
echo "🚀 Syncing to remote database..."

# Execute the sync
PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql \
    -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com \
    -p 5432 -U possue2_db_v5_user -d possue2_db_v5 \
    -f "$TEMP_SQL"

if [ $? -eq 0 ]; then
    echo "✅ Sync completed successfully!"
    
    echo ""
    echo "📊 Verification - Remote database after sync:"
    PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql \
        -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com \
        -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -c "
        SELECT 'Published Essays' as type, count(*) FROM essays WHERE published_at IS NOT NULL
        UNION
        SELECT 'Total Essays', count(*) FROM essays
        UNION  
        SELECT 'Admin Users', count(*) FROM admin_users
        UNION
        SELECT 'Subjects', count(*) FROM subjects;
    "
    
    echo ""
    echo "📝 Latest essays on remote:"
    PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql \
        -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com \
        -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -c "
        SELECT id, title, 
               CASE WHEN published_at IS NOT NULL THEN 'Published' ELSE 'Draft' END as status
        FROM essays 
        WHERE id > 1940 
        ORDER BY id DESC;
    "
    
else
    echo "❌ Sync failed!"
    echo "Check the SQL file for issues: $TEMP_SQL"
    exit 1
fi

# Cleanup
rm -f "$TEMP_SQL"

echo ""
echo "✨ Sync process completed!"
echo "🚀 Remember to restart your remote Strapi instance if needed."