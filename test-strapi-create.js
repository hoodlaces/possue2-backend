const axios = require('axios');

// Test creating one piece of content via Strapi API to see the proper structure
async function testCreateContent() {
  try {
    // First, let's create a simple test subject via the admin API
    const testSubject = {
      title: "TEST_SUBJECT_DELETE_ME",
      description: "This is a test subject to check the proper v5 structure",
      slug: "test-subject-delete-me"
    };

    console.log('🧪 Creating test subject via Strapi API...');
    
    // We'll need to authenticate first, but let's see the structure by checking 
    // what gets created vs our migrated data
    
    // For now, let's just create it manually and see what Strapi generates
    const { Client } = require('pg');
    
    const client = new Client({
      host: '127.0.0.1',
      port: 5432,
      database: 'strapi-marketplace-v5',
      user: 'postgres',
      password: '1212'
    });
    
    await client.connect();
    
    // Let's check what a fresh Strapi v5 installation creates for content
    console.log('📋 Checking current database structure...');
    
    // Check if there are any rows with different patterns
    const result = await client.query(`
      SELECT id, document_id, title, created_at, updated_at, published_at, created_by_id, updated_by_id, locale
      FROM subjects 
      ORDER BY id ASC 
      LIMIT 3
    `);
    
    console.log('Sample subject data:');
    console.table(result.rows);
    
    // Check for any missing fields or patterns
    const allSubjects = await client.query('SELECT COUNT(*) as count FROM subjects');
    console.log(`Total subjects in DB: ${allSubjects.rows[0].count}`);
    
    // Check if document_id pattern is correct (should be UUIDs)
    const documentIdPattern = await client.query(`
      SELECT document_id, LENGTH(document_id) as len 
      FROM subjects 
      WHERE document_id IS NOT NULL 
      LIMIT 3
    `);
    
    console.log('Document ID patterns:');
    console.table(documentIdPattern.rows);
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCreateContent();