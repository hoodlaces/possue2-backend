#!/usr/bin/env node

/**
 * Test script for practice sessions migration and API
 * This script can be run to verify the migration was successful
 */

const { Client } = require('pg');
const path = require('path');

async function testPracticeSessionsSetup() {
  console.log('🧪 Testing Practice Sessions Setup...\n');
  
  try {
    // Test database connection and table existence
    const client = new Client({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: process.env.DATABASE_PORT || 5432,
      database: process.env.DATABASE_NAME || 'strapi-marketplace-v5',
      user: process.env.DATABASE_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || '1212',
      ssl: process.env.DATABASE_SSL === 'true'
    });
    
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Check if practice_sessions table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'practice_sessions'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ practice_sessions table exists');
      
      // Check table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'practice_sessions'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
      });
      
      // Check indexes
      const indexes = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'practice_sessions';
      `);
      
      console.log(`\n📊 Indexes (${indexes.rows.length} found):`);
      indexes.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
      
      // Check migration log
      const migrationCheck = await client.query(`
        SELECT * FROM migration_log 
        WHERE migration_name = '002-create-practice-sessions'
        ORDER BY started_at DESC 
        LIMIT 1;
      `);
      
      if (migrationCheck.rows.length > 0) {
        const migration = migrationCheck.rows[0];
        console.log(`\n📜 Migration status: ${migration.status}`);
        console.log(`   Started: ${migration.started_at}`);
        if (migration.completed_at) {
          console.log(`   Completed: ${migration.completed_at}`);
        }
      }
      
    } else {
      console.log('❌ practice_sessions table does not exist - migration may not have been run');
    }
    
    await client.end();
    
    // Test file structure
    console.log('\n📁 Checking API file structure...');
    
    const fs = require('fs');
    const apiPath = path.join(__dirname, '..', 'src', 'api', 'practice-session');
    
    if (fs.existsSync(apiPath)) {
      console.log('✅ practice-session API directory exists');
      
      const requiredFiles = [
        'content-types/practice-session/schema.json',
        'controllers/practice-session.js',
        'routes/practice-session.js',
        'services/practice-session.js'
      ];
      
      requiredFiles.forEach(file => {
        const filePath = path.join(apiPath, file);
        if (fs.existsSync(filePath)) {
          console.log(`  ✅ ${file}`);
        } else {
          console.log(`  ❌ ${file} (missing)`);
        }
      });
    } else {
      console.log('❌ practice-session API directory does not exist');
    }
    
    console.log('\n🎉 Practice Sessions setup test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run the database migration: psql $DATABASE_URL -f database/migrations/002-create-practice-sessions.sql');
    console.log('   2. Start the Strapi server: npm run develop');
    console.log('   3. Test the API endpoints from the frontend');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Ensure PostgreSQL is running');
    console.log('   - Check DATABASE_URL environment variable');
    console.log('   - Verify migration has been run');
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testPracticeSessionsSetup();
}

module.exports = { testPracticeSessionsSetup };