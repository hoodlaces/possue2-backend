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
    console.log('🔧 Fixing document IDs for Strapi v5...');
    
    // Fix subjects
    const subjects = await client.query('SELECT id FROM subjects WHERE document_id IS NULL OR document_id = \'\'');
    console.log(`📚 Updating ${subjects.rows.length} subjects...`);
    
    for (const subject of subjects.rows) {
      const documentId = uuidv4();
      await client.query(
        'UPDATE subjects SET document_id = $1 WHERE id = $2',
        [documentId, subject.id]
      );
    }
    
    // Fix essays
    const essays = await client.query('SELECT id FROM essays WHERE document_id IS NULL OR document_id = \'\'');
    console.log(`📝 Updating ${essays.rows.length} essays...`);
    
    for (const essay of essays.rows) {
      const documentId = uuidv4();
      await client.query(
        'UPDATE essays SET document_id = $1 WHERE id = $2',
        [documentId, essay.id]
      );
    }
    
    // Fix answers
    const answers = await client.query('SELECT id FROM answers WHERE document_id IS NULL OR document_id = \'\'');
    console.log(`💡 Updating ${answers.rows.length} answers...`);
    
    for (const answer of answers.rows) {
      const documentId = uuidv4();
      await client.query(
        'UPDATE answers SET document_id = $1 WHERE id = $2',
        [documentId, answer.id]
      );
    }
    
    // Also ensure published_at is NULL for draft status in v5
    await client.query('UPDATE subjects SET published_at = NULL WHERE published_at IS NOT NULL');
    await client.query('UPDATE essays SET published_at = NULL WHERE published_at IS NOT NULL');
    await client.query('UPDATE answers SET published_at = NULL WHERE published_at IS NOT NULL');
    
    console.log('✅ Document IDs fixed successfully\!');
    console.log('📌 All content set to draft status (published_at = NULL)');
    
  } catch (error) {
    console.error('❌ Error fixing document IDs:', error.message);
  } finally {
    await client.end();
  }
}

fixDocumentIds();