#!/bin/bash

# Fix Essay Sync Script
# Fixes missing slugs, subject relations, and other sync issues

echo "🔧 Fixing Essay Sync Issues"
echo "=========================="

# Step 1: Update Missing Slugs
echo "📝 Step 1: Updating missing slugs..."

# Get essays without slugs and generate UPDATE statements
PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -t -c "
    SELECT 'UPDATE essays SET slug = ' || quote_literal(
        lower(
            regexp_replace(
                regexp_replace(
                    regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
                    '\s+', '-', 'g'
                ),
                '-+', '-', 'g'
            )
        )
    ) || ' WHERE id = ' || id || ';'
    FROM essays 
    WHERE slug IS NULL OR slug = '';" > /tmp/update-slugs.sql

# Execute slug updates
echo "Updating slugs..."
PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -f /tmp/update-slugs.sql

echo "✅ Slugs updated!"

# Step 2: Map essay IDs for subject relations
echo ""
echo "📊 Step 2: Preparing to sync subject relations..."

# Create a mapping of document_ids to new essay IDs
cat > /tmp/create_id_mapping.sql << 'EOF'
CREATE TEMP TABLE essay_id_mapping AS
WITH remote_essays AS (
    SELECT id as remote_id, document_id 
    FROM essays 
    WHERE id >= 1947
),
local_mapping AS (
    SELECT 
        CASE document_id
            WHEN 'yk837gdjpj63kijf9looqwa3' THEN 151  -- Question 1 - February, 2000
            WHEN 'diyvb4lyjybg8naztngujv0e' THEN 246  -- Question 2 - February, 2002
            WHEN 'alkue5biovl5uiznn7kdsx1g' THEN 1955 -- Question 1 - February, 2023
            WHEN 'fpperdt6l8bni3f1evaoa50w' THEN 1956 -- Question 1 - July, 2023
            WHEN 'oqn2i0xsywju0y4jwvcuvgkz' THEN 1959 -- Question 2 - February, 2023
            WHEN 'x4phlv5v10994u0wrjkjmy7i' THEN 1960 -- Question 4 - July, 2023 (draft)
            WHEN 'hg2h1pxbywaiye6ydbnc9ya5' THEN 1962 -- Question 5 - July, 2023 (draft)
            WHEN 'neuyu5yy1sovh9bajohlzbbt' THEN 1946 -- Question 3 - July, 2023 (draft)
            ELSE NULL
        END as local_id,
        document_id
    FROM remote_essays
)
SELECT re.remote_id, lm.local_id, re.document_id
FROM remote_essays re
JOIN local_mapping lm ON re.document_id = lm.document_id
WHERE lm.local_id IS NOT NULL;
EOF

# Get subject relations from local for these essays
echo "Getting subject relations from local database..."
PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -c "
    SELECT essay_id, subject_id, subject_order, essay_order 
    FROM essays_subjects_lnk 
    WHERE essay_id IN (151, 246, 1955, 1956, 1959, 1960, 1962, 1946, 1963, 1964, 1965)
    ORDER BY essay_id;" > /tmp/local_subject_relations.txt

# Create INSERT statements with ID mapping
echo "Creating subject relation inserts..."
cat > /tmp/sync_subjects.sql << 'EOF'
-- First create the mapping table
CREATE TEMP TABLE IF NOT EXISTS essay_id_mapping AS
WITH mappings AS (
    SELECT * FROM (VALUES
        (1947, 151),   -- Question 1 - February, 2000
        (1948, 246),   -- Question 2 - February, 2002
        (1949, 1955),  -- Question 1 - February, 2023
        (1950, 1956),  -- Question 1 - July, 2023 (published)
        (1951, 1959),  -- Question 2 - February, 2023
        (1952, 1960),  -- Question 4 - July, 2023 (draft)
        (1953, 1962),  -- Question 5 - July, 2023 (draft)
        (1954, 1963),  -- Question 5 - July, 2023 (published)
        (1955, 1964),  -- Question 3 - July, 2023 (published)
        (1956, 1965),  -- Question 4 - July, 2023 (published)
        (1980, 1946)   -- Question 3 - July, 2023 (draft)
    ) AS t(remote_id, local_id)
)
SELECT * FROM mappings;

-- Insert subject relations based on mapping
EOF

# Now we need to get the actual subject relations from local and transform them
PGPASSWORD=1212 psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 -t -c "
    WITH essay_mapping AS (
        SELECT * FROM (VALUES
            (1947, 151),   -- Question 1 - February, 2000
            (1948, 246),   -- Question 2 - February, 2002
            (1949, 1955),  -- Question 1 - February, 2023
            (1950, 1956),  -- Question 1 - July, 2023 (published)
            (1951, 1959),  -- Question 2 - February, 2023
            (1952, 1960),  -- Question 4 - July, 2023 (draft)
            (1953, 1962),  -- Question 5 - July, 2023 (draft)
            (1954, 1963),  -- Question 5 - July, 2023 (published)
            (1955, 1964),  -- Question 3 - July, 2023 (published)
            (1956, 1965),  -- Question 4 - July, 2023 (published)
            (1980, 1946)   -- Question 3 - July, 2023 (draft)
        ) AS t(remote_id, local_id)
    )
    SELECT 'INSERT INTO essays_subjects_lnk (essay_id, subject_id, subject_order, essay_order) VALUES (' ||
           em.remote_id || ', ' || 
           esl.subject_id || ', ' ||
           COALESCE(esl.subject_order::text, 'NULL') || ', ' ||
           COALESCE(esl.essay_order::text, 'NULL') || ');'
    FROM essays_subjects_lnk esl
    JOIN essay_mapping em ON esl.essay_id = em.local_id;" >> /tmp/sync_subjects.sql

echo "✅ Subject relation sync prepared!"

# Step 3: Fix user IDs and timestamps
echo ""
echo "👤 Step 3: Fixing user IDs and timestamps..."

# Get user ID from an existing essay
DEFAULT_USER_ID=$(PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -t -c "SELECT created_by_id FROM essays WHERE created_by_id IS NOT NULL LIMIT 1;" | tr -d ' ')

if [ ! -z "$DEFAULT_USER_ID" ]; then
    echo "Using default user ID: $DEFAULT_USER_ID"
    PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -c "
        UPDATE essays 
        SET created_by_id = $DEFAULT_USER_ID, 
            updated_by_id = $DEFAULT_USER_ID,
            updated_at = created_at
        WHERE id >= 1947 AND (created_by_id IS NULL OR updated_by_id IS NULL);"
    echo "✅ User IDs and timestamps fixed!"
else
    echo "⚠️  Could not find default user ID"
fi

# Execute subject relations sync
echo ""
echo "🔗 Executing subject relations sync..."
PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -f /tmp/sync_subjects.sql

# Verify results
echo ""
echo "📊 Verification:"
echo "Essays with slugs:"
PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -t -c "SELECT COUNT(*) FROM essays WHERE slug IS NOT NULL AND slug != '';"

echo "Essays with subject relations:"
PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -t -c "SELECT COUNT(DISTINCT essay_id) FROM essays_subjects_lnk;"

echo "Total subject links:"
PGPASSWORD=eOFn8Omh5hjqbk8UxoGBA6xEul1Z0zxn psql -h dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com -p 5432 -U possue2_db_v5_user -d possue2_db_v5 -t -c "SELECT COUNT(*) FROM essays_subjects_lnk;"

# Cleanup
rm -f /tmp/update-slugs.sql /tmp/sync_subjects.sql /tmp/local_subject_relations.txt /tmp/create_id_mapping.sql

echo ""
echo "✨ Essay sync fixes completed!"
echo "Note: You may still need to remove duplicate published versions manually."