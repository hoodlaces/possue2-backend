const { parse } = require('pg-connection-string');
const { Client } = require('pg');

const databaseUrl = 'postgres://possue:zY5Bx6s2D752UcM6oxIqnFIB6cD5JOqV@dpg-cbnfg29a6gds3kmf1qn0-a.oregon-postgres.render.com/possue2';
const config = parse(databaseUrl);
const client = new Client({
  ...config,
  ssl: { rejectUnauthorized: false }
});

async function fixMigration() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');
    
    // Check for duplicate document_ids in subjects table
    console.log('\n📊 Checking for duplicates...');
    const duplicates = await client.query(`
      SELECT document_id, COUNT(*) as count 
      FROM subjects 
      GROUP BY document_id 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('❌ Found duplicates:', duplicates.rows);
      
      // Remove duplicates, keeping the most recent one
      for (const dup of duplicates.rows) {
        console.log(`\n🔧 Fixing duplicate document_id: ${dup.document_id}`);
        
        await client.query(`
          DELETE FROM subjects 
          WHERE document_id = $1 
          AND id NOT IN (
            SELECT id FROM subjects 
            WHERE document_id = $1 
            ORDER BY updated_at DESC 
            LIMIT 1
          )
        `, [dup.document_id]);
        
        console.log(`✅ Removed duplicates for ${dup.document_id}`);
      }
    } else {
      console.log('✅ No duplicates found');
    }
    
    // Check migration table structure first
    console.log('\n📋 Checking migration table structure...');
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'strapi_migrations'
    `);
    console.log('Migration table columns:', columns.rows);
    
    // Check migration status 
    const migrations = await client.query(`
      SELECT * 
      FROM strapi_migrations 
      WHERE name LIKE '%discard-drafts%'
    `);
    console.log('Migration status:', migrations.rows);
    
    // If migration hasn't run, mark it as completed
    if (migrations.rows.length === 0) {
      console.log('\n🔄 Marking migration as completed...');
      
      // Get the correct column structure first
      const sampleMigration = await client.query('SELECT * FROM strapi_migrations LIMIT 1');
      console.log('Sample migration:', sampleMigration.rows[0]);
      
      // Insert with correct structure 
      await client.query(`
        INSERT INTO strapi_migrations (name, time) 
        VALUES ($1, NOW())
      `, ['core::5.0.0-discard-drafts']);
      console.log('✅ Migration marked as completed');
    }
    
    console.log('\n✅ Migration fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixMigration();