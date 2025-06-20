const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const v5DbConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
};

async function importFromRenderDump() {
  const v5Client = new Client(v5DbConfig);
  
  try {
    await v5Client.connect();
    console.log('🚀 Starting full import from Render database dump...');
    
    // First, drop and recreate database
    console.log('🗑️  Recreating database...');
    await v5Client.end();
    
    const adminClient = new Client({ ...v5DbConfig, database: 'postgres' });
    await adminClient.connect();
    await adminClient.query('DROP DATABASE IF EXISTS "strapi-marketplace-v5"');
    await adminClient.query('CREATE DATABASE "strapi-marketplace-v5"');
    await adminClient.end();
    
    // Import the full dump
    console.log('📥 Importing Render database dump...');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    await execPromise('psql -h 127.0.0.1 -p 5432 -U postgres -d strapi-marketplace-v5 < render-database-dump.sql 2>/dev/null');
    
    // Reconnect to check results
    const checkClient = new Client(v5DbConfig);
    await checkClient.connect();
    
    const counts = await checkClient.query(`
      SELECT 
        (SELECT COUNT(*) FROM subjects) as subjects,
        (SELECT COUNT(*) FROM essays) as essays,
        (SELECT COUNT(*) FROM answers) as answers
    `);
    
    console.log('✅ Import completed successfully!');
    console.log('📊 Final counts:');
    console.log(`   - Subjects: ${counts.rows[0].subjects}`);
    console.log(`   - Essays: ${counts.rows[0].essays}`);
    console.log(`   - Answers: ${counts.rows[0].answers}`);
    
    await checkClient.end();
    
    console.log('\n⚠️  Note: This is Strapi v4 data. You may need to:');
    console.log('   1. Start Strapi v5 to create the schema');
    console.log('   2. Use a migration tool to convert v4 data to v5 format');
    console.log('   3. Or use the complete-migration.js script with updated limits');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

importFromRenderDump();