const { parse } = require('pg-connection-string');
const { Client } = require('pg');

const databaseUrl = 'postgres://possue:zY5Bx6s2D752UcM6oxIqnFIB6cD5JOqV@dpg-cbnfg29a6gds3kmf1qn0-a.oregon-postgres.render.com/possue2';
const config = parse(databaseUrl);
const client = new Client({
  ...config,
  ssl: { rejectUnauthorized: false }
});

async function createMissingTables() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');
    
    // Check if answers_cmps table exists
    const tableExists = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'answers_cmps'
    `);
    
    if (tableExists.rows.length === 0) {
      console.log('🔧 Creating missing answers_cmps table...');
      
      // Look at the structure of similar tables
      const essaysCmpsStructure = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'essays_cmps'
        ORDER BY ordinal_position
      `);
      console.log('Essays_cmps structure:', essaysCmpsStructure.rows);
      
      // Create the answers_cmps table based on the same pattern
      await client.query(`
        CREATE TABLE answers_cmps (
          id SERIAL PRIMARY KEY,
          entity_id INTEGER,
          cmp_id INTEGER,
          field VARCHAR(255),
          "order" DOUBLE PRECISION DEFAULT 1
        )
      `);
      
      // Add indexes similar to other component tables
      await client.query(`
        CREATE INDEX answers_cmps_field_idx ON answers_cmps (field)
      `);
      await client.query(`
        CREATE INDEX answers_cmps_entity_id_idx ON answers_cmps (entity_id)
      `);
      await client.query(`
        CREATE INDEX answers_cmps_cmp_id_idx ON answers_cmps (cmp_id)
      `);
      
      console.log('✅ Created answers_cmps table with indexes');
    } else {
      console.log('✅ answers_cmps table already exists');
    }
    
    // Check if we need to populate it with existing answer SEO components
    const answerCount = await client.query('SELECT COUNT(*) FROM answers');
    console.log(`Found ${answerCount.rows[0].count} answers`);
    
    if (answerCount.rows[0].count > 0) {
      console.log('📋 Checking if answers have SEO components to migrate...');
      
      // This would be more complex - for now just ensure the table structure is correct
      console.log('⚠️ Manual SEO component migration may be needed for existing answers');
    }
    
    console.log('\n🎉 Missing table creation complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createMissingTables();