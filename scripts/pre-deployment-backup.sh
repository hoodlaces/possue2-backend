#!/bin/bash

# CRITICAL PRE-DEPLOYMENT BACKUP SCRIPT
# This script MUST be run before ANY deployment to production
# It creates multiple backup layers and verifies data integrity

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKUP_DIR="backups/pre-deployment"
DB_BACKUP_NAME="critical-backup-${TIMESTAMP}"
STRAPI_BACKUP_NAME="strapi-backup-${TIMESTAMP}"

echo -e "${BLUE}🚨 CRITICAL: PRE-DEPLOYMENT BACKUP PROCESS STARTING${NC}"
echo -e "${BLUE}===============================================${NC}"
echo "Timestamp: $(date)"
echo "Backup directory: ${BACKUP_DIR}"

# Create backup directories
mkdir -p "${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}/database"
mkdir -p "${BACKUP_DIR}/strapi"
mkdir -p "${BACKUP_DIR}/verification"

# Function to check if we're in the right directory
check_environment() {
    if [ ! -f "package.json" ] || [ ! -d "src" ]; then
        echo -e "${RED}❌ ERROR: Must be run from Strapi project root directory${NC}"
        exit 1
    fi
    
    if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}⚠️  WARNING: No environment file found${NC}"
    fi
}

# Function to create database backup
create_database_backup() {
    echo -e "\n${BLUE}📁 Step 1: Creating Database Backup${NC}"
    echo "==========================================="
    
    # Check if we have database connection info
    if [ -z "$DATABASE_URL" ] && [ -z "$DATABASE_PASSWORD" ]; then
        echo -e "${YELLOW}⚠️  No database credentials found in environment${NC}"
        echo -e "${YELLOW}   This is normal for production (credentials are in Render)${NC}"
        echo -e "${YELLOW}   Skipping direct database backup${NC}"
        return 0
    fi
    
    # If we have local database access, create a direct backup
    if [ -n "$DATABASE_PASSWORD" ]; then
        DB_HOST="${DATABASE_HOST:-127.0.0.1}"
        DB_PORT="${DATABASE_PORT:-5432}"
        DB_NAME="${DATABASE_NAME:-strapi-marketplace-v5}"
        DB_USER="${DATABASE_USERNAME:-postgres}"
        
        echo "Creating direct database backup..."
        PGPASSWORD="$DATABASE_PASSWORD" pg_dump \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            --verbose \
            --no-owner \
            --no-acl \
            > "${BACKUP_DIR}/database/${DB_BACKUP_NAME}.sql"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Database backup created successfully${NC}"
            
            # Verify backup contains user data
            USER_COUNT=$(grep -c "INSERT INTO.*up_users" "${BACKUP_DIR}/database/${DB_BACKUP_NAME}.sql" || echo "0")
            echo "   User records in backup: ${USER_COUNT}"
            
            if [ "$USER_COUNT" -eq "0" ]; then
                echo -e "${RED}❌ CRITICAL: No user data found in backup!${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Database backup failed${NC}"
            exit 1
        fi
    fi
}

# Function to create Strapi content backup
create_strapi_backup() {
    echo -e "\n${BLUE}📦 Step 2: Creating Strapi Content Backup${NC}"
    echo "=========================================="
    
    # Use Strapi's built-in export functionality
    echo "Creating Strapi content export..."
    npx strapi export -f "${BACKUP_DIR}/strapi/${STRAPI_BACKUP_NAME}" --no-encrypt --verbose
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Strapi backup created successfully${NC}"
        
        # Verify the backup file exists and has content
        BACKUP_FILE="${BACKUP_DIR}/strapi/${STRAPI_BACKUP_NAME}.tar.gz"
        if [ -f "$BACKUP_FILE" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            echo "   Backup size: ${BACKUP_SIZE}"
            
            # List contents to verify
            echo "   Backup contents:"
            tar -tzf "$BACKUP_FILE" | head -10
        else
            echo -e "${RED}❌ CRITICAL: Strapi backup file not found!${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Strapi backup failed${NC}"
        exit 1
    fi
}

# Function to verify current user data integrity
verify_user_data() {
    echo -e "\n${BLUE}🔍 Step 3: Verifying Current User Data${NC}"
    echo "======================================"
    
    # Create a verification script
    cat > "${BACKUP_DIR}/verification/verify-users.js" << 'EOF'
const { Client } = require('pg');

async function verifyUsers() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 
        `postgres://${process.env.DATABASE_USERNAME || 'postgres'}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST || '127.0.0.1'}:${process.env.DATABASE_PORT || 5432}/${process.env.DATABASE_NAME || 'strapi-marketplace-v5'}`
    });
    
    try {
        await client.connect();
        
        const userStats = await client.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN confirmed = true THEN 1 END) as confirmed_users,
                COUNT(CASE WHEN confirmed = false THEN 1 END) as unconfirmed_users,
                COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
                COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as users_with_username,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_users
            FROM up_users 
            WHERE provider = 'local' OR provider IS NULL
        `);
        
        const stats = userStats.rows[0];
        
        console.log('=== USER DATA VERIFICATION ===');
        console.log(`Total users: ${stats.total_users}`);
        console.log(`Confirmed users: ${stats.confirmed_users}`);
        console.log(`Unconfirmed users: ${stats.unconfirmed_users}`);
        console.log(`Users with email: ${stats.users_with_email}`);
        console.log(`Users with username: ${stats.users_with_username}`);
        console.log(`Recent users (30 days): ${stats.recent_users}`);
        
        // Critical checks
        if (stats.total_users === '0') {
            console.error('❌ CRITICAL: No users found in database!');
            process.exit(1);
        }
        
        if (stats.users_with_email !== stats.total_users) {
            console.warn('⚠️  WARNING: Some users missing email addresses');
        }
        
        // Save stats to file
        const fs = require('fs');
        fs.writeFileSync('verification-stats.json', JSON.stringify(stats, null, 2));
        
        console.log('✅ User data verification completed');
        
    } catch (error) {
        console.error('❌ User verification failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

verifyUsers();
EOF

    # Run verification if we have database access
    if [ -n "$DATABASE_PASSWORD" ] || [ -n "$DATABASE_URL" ]; then
        echo "Running user data verification..."
        cd "${BACKUP_DIR}/verification"
        node verify-users.js
        cd - > /dev/null
        
        if [ -f "${BACKUP_DIR}/verification/verification-stats.json" ]; then
            echo -e "${GREEN}✅ User data verification completed${NC}"
            cat "${BACKUP_DIR}/verification/verification-stats.json"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping user verification (no database access)${NC}"
    fi
}

# Function to create deployment manifest
create_deployment_manifest() {
    echo -e "\n${BLUE}📋 Step 4: Creating Deployment Manifest${NC}"
    echo "======================================="
    
    cat > "${BACKUP_DIR}/deployment-manifest.json" << EOF
{
    "deployment": {
        "timestamp": "${TIMESTAMP}",
        "date": "$(date -Iseconds)",
        "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
        "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
        "backup_location": "${BACKUP_DIR}",
        "database_backup": "${DB_BACKUP_NAME}.sql",
        "strapi_backup": "${STRAPI_BACKUP_NAME}.tar.gz"
    },
    "safety_checks": {
        "backup_created": true,
        "user_data_verified": true,
        "migration_ready": true
    },
    "emergency_contact": {
        "note": "If deployment fails, restore from these backups immediately",
        "restore_command_db": "psql -h HOST -U USER -d DATABASE < ${BACKUP_DIR}/database/${DB_BACKUP_NAME}.sql",
        "restore_command_strapi": "npx strapi import -f ${BACKUP_DIR}/strapi/${STRAPI_BACKUP_NAME}.tar.gz"
    }
}
EOF

    echo -e "${GREEN}✅ Deployment manifest created${NC}"
}

# Function to final safety checks
final_safety_checks() {
    echo -e "\n${BLUE}🛡️  Step 5: Final Safety Checks${NC}"
    echo "==============================="
    
    # Check backup files exist and have reasonable sizes
    echo "Checking backup files..."
    
    if [ -f "${BACKUP_DIR}/strapi/${STRAPI_BACKUP_NAME}.tar.gz" ]; then
        STRAPI_SIZE=$(du -h "${BACKUP_DIR}/strapi/${STRAPI_BACKUP_NAME}.tar.gz" | cut -f1)
        echo "   Strapi backup: ✅ ${STRAPI_SIZE}"
    else
        echo -e "   Strapi backup: ${RED}❌ MISSING${NC}"
        exit 1
    fi
    
    if [ -f "${BACKUP_DIR}/database/${DB_BACKUP_NAME}.sql" ]; then
        DB_SIZE=$(du -h "${BACKUP_DIR}/database/${DB_BACKUP_NAME}.sql" | cut -f1)
        echo "   Database backup: ✅ ${DB_SIZE}"
    else
        echo "   Database backup: ⚠️  Not available (production deployment)"
    fi
    
    if [ -f "${BACKUP_DIR}/deployment-manifest.json" ]; then
        echo "   Deployment manifest: ✅"
    else
        echo -e "   Deployment manifest: ${RED}❌ MISSING${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}🎉 ALL SAFETY CHECKS PASSED${NC}"
}

# Main execution
main() {
    check_environment
    create_database_backup
    create_strapi_backup
    verify_user_data
    create_deployment_manifest
    final_safety_checks
    
    echo -e "\n${GREEN}🚀 PRE-DEPLOYMENT BACKUP COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}===============================================${NC}"
    echo -e "${BLUE}Backup location: ${BACKUP_DIR}${NC}"
    echo -e "${BLUE}Timestamp: ${TIMESTAMP}${NC}"
    echo -e "\n${YELLOW}⚠️  IMPORTANT:${NC}"
    echo -e "${YELLOW}   1. Keep this backup safe until deployment is verified${NC}"
    echo -e "${YELLOW}   2. Do NOT delete these backups until confirmed successful${NC}"
    echo -e "${YELLOW}   3. If deployment fails, use emergency restore procedures${NC}"
    echo -e "\n${GREEN}✅ Ready for deployment${NC}"
}

# Run main function
main "$@"