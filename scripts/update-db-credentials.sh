#!/bin/bash
# Script to update all shell scripts to use environment variables for database credentials

# Set default environment variables if not already set
export DATABASE_HOST="${DATABASE_HOST:-dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com}"
export DATABASE_PORT="${DATABASE_PORT:-5432}"
export DATABASE_NAME="${DATABASE_NAME:-possue2_db_v5}"
export DATABASE_USERNAME="${DATABASE_USERNAME:-possue2_db_v5_user}"

# Check if DATABASE_PASSWORD is set
if [ -z "$DATABASE_PASSWORD" ]; then
    echo "❌ ERROR: DATABASE_PASSWORD environment variable is required"
    echo "Set it with: export DATABASE_PASSWORD='your_new_password'"
    exit 1
fi

echo "✅ Database credentials configured from environment variables"
echo "   Host: $DATABASE_HOST"
echo "   Port: $DATABASE_PORT"
echo "   Database: $DATABASE_NAME"
echo "   User: $DATABASE_USERNAME"
echo "   Password: [HIDDEN]"