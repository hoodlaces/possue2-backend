#!/usr/bin/env node

/**
 * Schema Deployment Script
 * 
 * This script orchestrates the deployment of schema changes to fix
 * the lawSchool field production issue.
 * 
 * Process:
 * 1. Backup verification
 * 2. Pre-migration checks
 * 3. Database migration execution
 * 4. Schema verification
 * 5. Post-migration validation
 */

const { spawn } = require('child_process');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const MIGRATION_FILE = path.join(__dirname, '../database/manual-migrations/003-fix-law-school-field.sql');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Colors for better output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`🔧 Executing: ${command} ${args.join(' ')}`, 'blue');
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function connectToDatabase() {
  log('🔗 Connecting to database...', 'blue');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    log('✅ Database connection established', 'green');
    return client;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    throw error;
  }
}

async function verifyBackup() {
  log('\n📋 STEP 1: Backup Verification', 'yellow');
  log('=============================', 'yellow');
  
  try {
    // Check if backup script exists
    const backupScript = path.join(__dirname, 'pre-deployment-backup.sh');
    if (!fs.existsSync(backupScript)) {
      log('⚠️  Backup script not found, checking alternative backup methods...', 'yellow');
      
      // Check for other backup scripts
      const backupDir = path.join(__dirname);
      const backupFiles = fs.readdirSync(backupDir).filter(file => 
        file.includes('backup') && file.endsWith('.sh')
      );
      
      if (backupFiles.length > 0) {
        log(`📁 Found backup scripts: ${backupFiles.join(', ')}`, 'blue');
        log('⚠️  Please run a backup script before proceeding', 'yellow');
      } else {
        log('❌ No backup scripts found!', 'red');
        log('🚨 CRITICAL: Always backup before schema changes', 'red');
        log('💡 You can create a manual backup with:', 'blue');
        log('   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql', 'blue');
      }
      
      // Ask user to confirm they have a backup
      log('\n❗ Do you have a recent backup of the production database?', 'yellow');
      log('   Press Ctrl+C to abort if you need to create a backup first', 'yellow');
      log('   This script will continue in 10 seconds...', 'yellow');
      
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      log('📁 Found backup script, ensuring it\'s executable...', 'blue');
      await executeCommand('chmod', ['+x', backupScript]);
      
      log('💾 Running pre-deployment backup...', 'blue');
      await executeCommand(backupScript);
      log('✅ Backup completed successfully', 'green');
    }
    
    return true;
  } catch (error) {
    log(`❌ Backup verification failed: ${error.message}`, 'red');
    return false;
  }
}

async function runPreMigrationChecks(client) {
  log('\n📋 STEP 2: Pre-Migration Checks', 'yellow');
  log('===============================', 'yellow');
  
  try {
    // Check if migration log table exists
    log('🔍 Checking migration log table...', 'blue');
    const logTableResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'migration_log'
      ) as table_exists
    `);
    
    if (!logTableResult.rows[0].table_exists) {
      log('⚠️  Migration log table does not exist', 'yellow');
      log('🔧 Creating migration log table...', 'blue');
      
      const createLogScript = path.join(__dirname, '../database/manual-migrations/000-create-migration-log.sql');
      if (fs.existsSync(createLogScript)) {
        await executeCommand('psql', [DATABASE_URL, '-f', createLogScript]);
        log('✅ Migration log table created', 'green');
      } else {
        log('❌ Migration log creation script not found', 'red');
        return false;
      }
    } else {
      log('✅ Migration log table exists', 'green');
    }
    
    // Check current user_profiles table structure
    log('🔍 Checking current user_profiles table structure...', 'blue');
    const tableResult = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      AND column_name IN ('law_school', 'law_school_year', 'current_semester')
      ORDER BY column_name
    `);
    
    if (tableResult.rows.length === 0) {
      log('❌ user_profiles table or required columns not found', 'red');
      return false;
    }
    
    log('📊 Current table structure:', 'blue');
    tableResult.rows.forEach(row => {
      log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`, 'blue');
    });
    
    // Check for existing profiles
    const profileCount = await client.query('SELECT COUNT(*) as count FROM user_profiles');
    log(`📈 Current profile count: ${profileCount.rows[0].count}`, 'blue');
    
    return true;
  } catch (error) {
    log(`❌ Pre-migration checks failed: ${error.message}`, 'red');
    return false;
  }
}

async function executeMigration(client) {
  log('\n📋 STEP 3: Database Migration Execution', 'yellow');
  log('======================================', 'yellow');
  
  try {
    // Verify migration file exists
    if (!fs.existsSync(MIGRATION_FILE)) {
      log(`❌ Migration file not found: ${MIGRATION_FILE}`, 'red');
      return false;
    }
    
    log(`📁 Migration file: ${MIGRATION_FILE}`, 'blue');
    
    // Read and display migration summary
    const migrationContent = fs.readFileSync(MIGRATION_FILE, 'utf8');
    const lines = migrationContent.split('\n');
    const comments = lines.filter(line => line.trim().startsWith('--')).slice(0, 10);
    
    log('📋 Migration summary:', 'blue');
    comments.forEach(comment => {
      log(`   ${comment}`, 'blue');
    });
    
    log('\n🚀 Starting migration execution...', 'blue');
    
    // Execute migration using psql
    await executeCommand('psql', [DATABASE_URL, '-f', MIGRATION_FILE]);
    
    log('✅ Migration executed successfully', 'green');
    
    // Verify migration was logged
    const migrationCheck = await client.query(`
      SELECT status, completed_at 
      FROM migration_log 
      WHERE migration_name = '003-fix-law-school-field'
    `);
    
    if (migrationCheck.rows.length > 0) {
      const migration = migrationCheck.rows[0];
      log(`✅ Migration logged with status: ${migration.status}`, 'green');
      
      if (migration.status !== 'COMPLETED') {
        log('⚠️  Migration may not have completed successfully', 'yellow');
        return false;
      }
    } else {
      log('⚠️  Migration not found in log table', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Migration execution failed: ${error.message}`, 'red');
    return false;
  }
}

async function runSchemaVerification() {
  log('\n📋 STEP 4: Schema Verification', 'yellow');
  log('=============================', 'yellow');
  
  try {
    const verificationScript = path.join(__dirname, 'verify-schema-sync.js');
    
    if (!fs.existsSync(verificationScript)) {
      log('❌ Schema verification script not found', 'red');
      return false;
    }
    
    log('🔍 Running schema verification...', 'blue');
    await executeCommand('node', [verificationScript]);
    
    log('✅ Schema verification completed successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Schema verification failed: ${error.message}`, 'red');
    return false;
  }
}

async function runPostMigrationValidation(client) {
  log('\n📋 STEP 5: Post-Migration Validation', 'yellow');
  log('====================================', 'yellow');
  
  try {
    // Check that lawSchool field is now a string type
    log('🔍 Validating lawSchool field type...', 'blue');
    const fieldCheck = await client.query(`
      SELECT data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      AND column_name = 'law_school'
    `);
    
    if (fieldCheck.rows.length === 0) {
      log('❌ law_school field not found', 'red');
      return false;
    }
    
    const field = fieldCheck.rows[0];
    const isStringType = ['character varying', 'text'].includes(field.data_type);
    const isNullable = field.is_nullable === 'YES';
    
    log(`📊 law_school field type: ${field.data_type}`, isStringType ? 'green' : 'red');
    log(`📊 law_school nullable: ${field.is_nullable}`, isNullable ? 'green' : 'red');
    
    if (!isStringType) {
      log('❌ law_school field is not a string type', 'red');
      return false;
    }
    
    if (!isNullable) {
      log('❌ law_school field should be nullable', 'red');
      return false;
    }
    
    // Test that we can insert a profile with string law_school
    log('🧪 Testing profile insertion with string law_school...', 'blue');
    
    try {
      await client.query('BEGIN');
      
      const testResult = await client.query(`
        INSERT INTO user_profiles (law_school, created_at, updated_at) 
        VALUES ($1, NOW(), NOW()) 
        RETURNING id
      `, ['Test Law School']);
      
      const testId = testResult.rows[0].id;
      log(`✅ Test profile created with ID: ${testId}`, 'green');
      
      // Clean up test data
      await client.query('ROLLBACK');
      log('✅ Test data cleaned up', 'green');
      
    } catch (testError) {
      await client.query('ROLLBACK');
      log(`❌ Profile insertion test failed: ${testError.message}`, 'red');
      return false;
    }
    
    log('✅ All post-migration validations passed', 'green');
    return true;
  } catch (error) {
    log(`❌ Post-migration validation failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 Schema Deployment Script Starting...', 'green');
  log('=====================================\n', 'green');
  
  let client;
  
  try {
    // Step 1: Backup verification
    const backupOk = await verifyBackup();
    if (!backupOk) {
      log('❌ Backup verification failed. Aborting deployment.', 'red');
      process.exit(1);
    }
    
    // Connect to database
    client = await connectToDatabase();
    
    // Step 2: Pre-migration checks
    const preChecksOk = await runPreMigrationChecks(client);
    if (!preChecksOk) {
      log('❌ Pre-migration checks failed. Aborting deployment.', 'red');
      process.exit(1);
    }
    
    // Step 3: Execute migration
    const migrationOk = await executeMigration(client);
    if (!migrationOk) {
      log('❌ Migration execution failed. Check logs and consider rollback.', 'red');
      process.exit(1);
    }
    
    // Step 4: Schema verification
    const verificationOk = await runSchemaVerification();
    if (!verificationOk) {
      log('❌ Schema verification failed. Migration may be incomplete.', 'red');
      process.exit(1);
    }
    
    // Step 5: Post-migration validation
    const validationOk = await runPostMigrationValidation(client);
    if (!validationOk) {
      log('❌ Post-migration validation failed.', 'red');
      process.exit(1);
    }
    
    // Success!
    log('\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!', 'green');
    log('===================================', 'green');
    log('✅ Database migration executed', 'green');
    log('✅ Schema verified and validated', 'green');
    log('✅ Ready for Strapi restart', 'green');
    
    log('\n🔄 NEXT STEPS:', 'yellow');
    log('1. Restart your Strapi application to reload the schema', 'yellow');
    log('2. Test profile saves on the frontend', 'yellow');
    log('3. Monitor debug logs for successful profile saves', 'yellow');
    log('4. Verify no more fallback storage warnings', 'yellow');
    
    log('\n📈 EXPECTED RESULTS:', 'blue');
    log('• Profile dropdown selections should save correctly', 'blue');
    log('• Law school selections will be stored as names (strings)', 'blue');
    log('• No more 500 errors on profile saves', 'blue');
    log('• Data will persist in the database', 'blue');
    
  } catch (error) {
    log(`\n💥 Deployment failed: ${error.message}`, 'red');
    log('Stack trace:', 'red');
    console.error(error.stack);
    
    log('\n🚨 ROLLBACK PROCEDURES:', 'yellow');
    log('1. Check EMERGENCY-ROLLBACK-PROCEDURES.md', 'yellow');
    log('2. Restore from pre-deployment backup if needed', 'yellow');
    log('3. Investigate the error before retrying', 'yellow');
    
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      log('\n🔒 Database connection closed', 'blue');
    }
  }
}

// Run the deployment
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  verifyBackup,
  runPreMigrationChecks,
  executeMigration,
  runSchemaVerification,
  runPostMigrationValidation
};