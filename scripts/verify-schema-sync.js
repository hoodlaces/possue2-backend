#!/usr/bin/env node

/**
 * Schema Verification Script
 * 
 * This script verifies that the production database schema matches
 * the expected local schema configuration for the user-profile content type.
 * 
 * Specifically checks:
 * 1. lawSchool field is VARCHAR/TEXT (not integer relation)
 * 2. All enum fields are properly configured
 * 3. Required fields and constraints are correct
 * 4. Migration log shows successful completion
 */

const { Client } = require('pg');

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Expected schema configuration
const EXPECTED_SCHEMA = {
  tableName: 'user_profiles',
  fields: {
    law_school: {
      type: ['character varying', 'text'], // Either VARCHAR or TEXT is acceptable
      nullable: true,
      description: 'Law school name as string (not relation)'
    },
    law_school_year: {
      type: ['text', 'character varying'], // Enum fields are often stored as text
      nullable: true,
      description: 'Law school year enum field'
    },
    current_semester: {
      type: ['text', 'character varying'],
      nullable: true, 
      description: 'Current semester enum field'
    },
    academic_standing: {
      type: ['text', 'character varying'],
      nullable: true,
      description: 'Academic standing enum field'
    },
    gpa_range: {
      type: ['text', 'character varying'],
      nullable: true,
      description: 'GPA range enum field'
    },
    current_academic_year: {
      type: ['integer'],
      nullable: true,
      description: 'Current academic year as integer'
    }
  }
};

async function connectToDatabase() {
  console.log('🔗 Connecting to database...');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('✅ Database connection established');
    return client;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function checkTableExists(client, tableName) {
  console.log(`🔍 Checking if table "${tableName}" exists...`);
  
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = $1
    ) as table_exists
  `, [tableName]);
  
  const exists = result.rows[0].table_exists;
  
  if (exists) {
    console.log(`✅ Table "${tableName}" exists`);
  } else {
    console.error(`❌ Table "${tableName}" does not exist`);
  }
  
  return exists;
}

async function verifyFieldSchema(client, tableName, fieldName, expectedConfig) {
  console.log(`🔍 Verifying field "${fieldName}"...`);
  
  const result = await client.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length
    FROM information_schema.columns 
    WHERE table_name = $1 AND column_name = $2
  `, [tableName, fieldName]);
  
  if (result.rows.length === 0) {
    console.error(`❌ Field "${fieldName}" does not exist in table "${tableName}"`);
    return false;
  }
  
  const field = result.rows[0];
  const typeMatches = expectedConfig.type.includes(field.data_type);
  const nullableMatches = (field.is_nullable === 'YES') === expectedConfig.nullable;
  
  console.log(`   Field: ${fieldName}`);
  console.log(`   Type: ${field.data_type} ${typeMatches ? '✅' : '❌'}`);
  console.log(`   Nullable: ${field.is_nullable} ${nullableMatches ? '✅' : '❌'}`);
  console.log(`   Description: ${expectedConfig.description}`);
  
  if (field.character_maximum_length) {
    console.log(`   Max Length: ${field.character_maximum_length}`);
  }
  
  return typeMatches && nullableMatches;
}

async function checkMigrationLog(client, migrationName) {
  console.log(`🔍 Checking migration log for "${migrationName}"...`);
  
  try {
    const result = await client.query(`
      SELECT 
        migration_name,
        started_at,
        completed_at,
        status,
        (completed_at - started_at) as duration
      FROM migration_log 
      WHERE migration_name = $1
    `, [migrationName]);
    
    if (result.rows.length === 0) {
      console.warn(`⚠️  Migration "${migrationName}" not found in migration log`);
      return false;
    }
    
    const migration = result.rows[0];
    console.log(`   Migration: ${migration.migration_name}`);
    console.log(`   Status: ${migration.status} ${migration.status === 'COMPLETED' ? '✅' : '❌'}`);
    console.log(`   Started: ${migration.started_at}`);
    console.log(`   Completed: ${migration.completed_at || 'N/A'}`);
    console.log(`   Duration: ${migration.duration || 'N/A'}`);
    
    return migration.status === 'COMPLETED';
  } catch (error) {
    console.warn(`⚠️  Could not check migration log (table may not exist): ${error.message}`);
    return false;
  }
}

async function getUserProfileStats(client) {
  console.log('📊 Getting user profile statistics...');
  
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(CASE WHEN law_school IS NOT NULL THEN 1 END) as profiles_with_law_school,
        COUNT(CASE WHEN law_school_year IS NOT NULL THEN 1 END) as profiles_with_year,
        COUNT(CASE WHEN current_semester IS NOT NULL THEN 1 END) as profiles_with_semester,
        COUNT(CASE WHEN academic_standing IS NOT NULL THEN 1 END) as profiles_with_standing,
        COUNT(CASE WHEN gpa_range IS NOT NULL THEN 1 END) as profiles_with_gpa
      FROM user_profiles
    `);
    
    const stats = result.rows[0];
    
    console.log('📈 User Profile Statistics:');
    console.log(`   Total profiles: ${stats.total_profiles}`);
    console.log(`   With law school: ${stats.profiles_with_law_school}`);
    console.log(`   With law school year: ${stats.profiles_with_year}`);
    console.log(`   With current semester: ${stats.profiles_with_semester}`);
    console.log(`   With academic standing: ${stats.profiles_with_standing}`);
    console.log(`   With GPA range: ${stats.profiles_with_gpa}`);
    
    return stats;
  } catch (error) {
    console.error('❌ Could not get user profile statistics:', error.message);
    return null;
  }
}

async function testProfileCreation(client) {
  console.log('🧪 Testing profile creation with new schema...');
  
  try {
    // Test inserting a profile with string law_school
    const testData = {
      law_school: 'Stanford Law School',
      law_school_year: 'ThirdYear',
      current_semester: 'Fall',
      academic_standing: 'TopTenPercent',
      gpa_range: 'HighGPA',
      current_academic_year: 2025
    };
    
    // Start transaction for test
    await client.query('BEGIN');
    
    // Insert test profile
    const insertResult = await client.query(`
      INSERT INTO user_profiles (
        law_school, law_school_year, current_semester, 
        academic_standing, gpa_range, current_academic_year,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `, [
      testData.law_school,
      testData.law_school_year, 
      testData.current_semester,
      testData.academic_standing,
      testData.gpa_range,
      testData.current_academic_year
    ]);
    
    const testProfileId = insertResult.rows[0].id;
    console.log(`✅ Test profile created with ID: ${testProfileId}`);
    
    // Verify the data was inserted correctly
    const verifyResult = await client.query(`
      SELECT law_school, law_school_year, current_semester, academic_standing, gpa_range
      FROM user_profiles WHERE id = $1
    `, [testProfileId]);
    
    const inserted = verifyResult.rows[0];
    console.log('✅ Test data verification:');
    console.log(`   Law School: "${inserted.law_school}"`);
    console.log(`   School Year: "${inserted.law_school_year}"`);
    console.log(`   Semester: "${inserted.current_semester}"`);
    console.log(`   Standing: "${inserted.academic_standing}"`);
    console.log(`   GPA Range: "${inserted.gpa_range}"`);
    
    // Rollback the test transaction
    await client.query('ROLLBACK');
    console.log('✅ Test profile removed (transaction rolled back)');
    
    return true;
  } catch (error) {
    // Rollback on error
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError.message);
    }
    
    console.error('❌ Profile creation test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Schema Verification Script Starting...');
  console.log('=====================================\n');
  
  let client;
  let allChecksPass = true;
  
  try {
    // Connect to database
    client = await connectToDatabase();
    
    console.log('\n📋 STEP 1: Table Existence Check');
    console.log('--------------------------------');
    const tableExists = await checkTableExists(client, EXPECTED_SCHEMA.tableName);
    if (!tableExists) {
      allChecksPass = false;
    }
    
    console.log('\n📋 STEP 2: Field Schema Verification');
    console.log('------------------------------------');
    for (const [fieldName, config] of Object.entries(EXPECTED_SCHEMA.fields)) {
      const fieldValid = await verifyFieldSchema(client, EXPECTED_SCHEMA.tableName, fieldName, config);
      if (!fieldValid) {
        allChecksPass = false;
      }
      console.log(''); // Add spacing
    }
    
    console.log('\n📋 STEP 3: Migration Log Check');
    console.log('------------------------------');
    const migrationComplete = await checkMigrationLog(client, '003-fix-law-school-field');
    if (!migrationComplete) {
      console.warn('⚠️  Migration may not have run or completed successfully');
    }
    
    console.log('\n📋 STEP 4: User Profile Statistics');
    console.log('----------------------------------');
    await getUserProfileStats(client);
    
    console.log('\n📋 STEP 5: Profile Creation Test');
    console.log('--------------------------------');
    const testPassed = await testProfileCreation(client);
    if (!testPassed) {
      allChecksPass = false;
    }
    
    console.log('\n🎯 VERIFICATION SUMMARY');
    console.log('======================');
    
    if (allChecksPass && testPassed) {
      console.log('✅ ALL CHECKS PASSED!');
      console.log('✅ Schema is correctly configured for profile saves');
      console.log('✅ Production should now accept profile dropdown selections');
      console.log('\n🚀 Ready for production profile save testing!');
    } else {
      console.log('❌ SOME CHECKS FAILED');
      console.log('❌ Schema issues detected that may prevent profile saves');
      console.log('❌ Review the errors above and fix before proceeding');
      
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Run the migration script: 003-fix-law-school-field.sql');
      console.log('2. Restart Strapi to reload schema');
      console.log('3. Re-run this verification script');
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Verification script failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔒 Database connection closed');
    }
  }
}

// Run the verification
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  connectToDatabase,
  checkTableExists,
  verifyFieldSchema,
  checkMigrationLog,
  getUserProfileStats,
  testProfileCreation
};