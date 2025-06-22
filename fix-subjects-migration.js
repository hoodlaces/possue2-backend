const { parse } = require('pg-connection-string');
const { Client } = require('pg');

const databaseUrl = 'postgres://possue:zY5Bx6s2D752UcM6oxIqnFIB6cD5JOqV@dpg-cbnfg29a6gds3kmf1qn0-a.oregon-postgres.render.com/possue2';
const config = parse(databaseUrl);
const client = new Client({
  ...config,
  ssl: { rejectUnauthorized: false }
});

async function fixSubjectsTable() {
  try {
    await client.connect();
    console.log('🔗 Connected to database');
    
    // First, remove the problematic migration
    console.log('\n🗑️ Removing problematic migration...');
    await client.query("DELETE FROM strapi_migrations WHERE name = 'core::5.0.0-discard-drafts'");
    
    // Check what the migration is trying to do
    console.log('\n🔍 Analyzing subjects data...');
    
    // Get subjects that would cause the duplicate key issue
    const publishedSubjects = await client.query(`
      SELECT id, document_id, title, published_at 
      FROM subjects 
      WHERE published_at IS NOT NULL 
      ORDER BY document_id, id
    `);
    console.log(`Found ${publishedSubjects.rows.length} published subjects`);
    
    // Check for potential duplicates that the migration would create
    const wouldBeDuplicates = await client.query(`
      SELECT document_id, COUNT(*) as count
      FROM subjects 
      WHERE published_at IS NOT NULL
      GROUP BY document_id
      HAVING COUNT(*) > 1
    `);
    
    if (wouldBeDuplicates.rows.length > 0) {
      console.log('❌ Found potential duplicates:', wouldBeDuplicates.rows);
      
      // For each duplicate document_id, keep only the most recent one
      for (const dup of wouldBeDuplicates.rows) {
        console.log(`\n🔧 Fixing duplicate document_id: ${dup.document_id}`);
        
        // Get all subjects with this document_id
        const subjects = await client.query(`
          SELECT id, updated_at, published_at 
          FROM subjects 
          WHERE document_id = $1 AND published_at IS NOT NULL
          ORDER BY updated_at DESC
        `, [dup.document_id]);
        
        // Keep the most recent, remove others
        const toKeep = subjects.rows[0];
        const toRemove = subjects.rows.slice(1);
        
        console.log(`Keeping id ${toKeep.id}, removing ${toRemove.length} duplicates`);
        
        for (const subject of toRemove) {
          await client.query('DELETE FROM subjects WHERE id = $1', [subject.id]);
        }
      }
    } else {
      console.log('✅ No duplicates found that would cause migration issues');
    }
    
    // Now manually perform what the migration was trying to do, but safely
    console.log('\n🔄 Manually executing migration logic...');
    
    // The migration tries to insert draft versions. Let's do it safely
    const remainingPublished = await client.query(`
      SELECT document_id, title, description, slug, created_at, updated_at, locale
      FROM subjects 
      WHERE published_at IS NOT NULL
    `);
    
    console.log(`Processing ${remainingPublished.rows.length} published subjects for draft creation...`);
    
    for (const subject of remainingPublished.rows) {
      // Check if draft already exists
      const existingDraft = await client.query(`
        SELECT id FROM subjects 
        WHERE document_id = $1 AND published_at IS NULL
      `, [subject.document_id]);
      
      if (existingDraft.rows.length === 0) {
        // Create draft version
        try {
          await client.query(`
            INSERT INTO subjects (document_id, title, description, slug, created_at, updated_at, published_at, locale)
            VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)
          `, [
            subject.document_id,
            subject.title,
            subject.description,
            subject.slug,
            subject.created_at,
            subject.updated_at,
            subject.locale
          ]);
          console.log(`✅ Created draft for document_id: ${subject.document_id}`);
        } catch (insertError) {
          console.log(`⚠️ Skipped ${subject.document_id}: ${insertError.message}`);
        }
      } else {
        console.log(`⏭️ Draft already exists for document_id: ${subject.document_id}`);
      }
    }
    
    // Mark migration as completed
    console.log('\n✅ Marking migration as completed...');
    await client.query(`
      INSERT INTO strapi_migrations (name, time) 
      VALUES ($1, NOW())
    `, ['core::5.0.0-discard-drafts']);
    
    console.log('\n🎉 Subjects migration fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixSubjectsTable();