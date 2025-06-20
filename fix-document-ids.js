const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
};

async function fixDocumentIds() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('🔧 Fixing document IDs for Strapi v5 compatibility...');
    
    const tables = ['subjects', 'essays', 'answers'];
    
    for (const table of tables) {
      console.log(`📋 Processing ${table}...`);
      
      // Get all records without document_id
      const records = await client.query(`
        SELECT id FROM ${table} WHERE document_id IS NULL OR document_id = ''
      `);
      
      console.log(`Found ${records.rows.length} records to fix in ${table}`);
      
      // Update each record with a unique document_id
      for (const record of records.rows) {
        const documentId = uuidv4();
        await client.query(`
          UPDATE ${table} SET document_id = $1 WHERE id = $2
        `, [documentId, record.id]);
      }
      
      console.log(`✅ Fixed ${records.rows.length} records in ${table}`);
    }
    
    // Verify the fix
    console.log('\n📊 Verification:');
    for (const table of tables) {
      const count = await client.query(`SELECT COUNT(*) FROM ${table} WHERE document_id IS NOT NULL AND document_id != ''`);
      console.log(`   - ${table}: ${count.rows[0].count} records with document_id`);
    }
    
    console.log('\n🎉 Document IDs fixed! Content should now appear in Strapi v5 admin panel.');
    
  } catch (error) {
    console.error('❌ Error fixing document IDs:', error);
  } finally {
    await client.end();
  }
}

fixDocumentIds();