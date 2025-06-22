const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
});

async function createDraftVersions() {
  try {
    await client.connect();
    console.log('✅ Connected to LOCAL database');
    
    // Create draft versions for Essays
    console.log('\n📝 Creating draft versions for Essays...');
    const essaysResult = await client.query(`
      INSERT INTO essays (document_id, title, content, slug, created_at, updated_at, published_at, created_by_id, updated_by_id, locale)
      SELECT 
        document_id,
        title,
        content,
        slug,
        created_at,
        updated_at,
        NULL as published_at,  -- Draft version has NULL published_at
        created_by_id,
        updated_by_id,
        locale
      FROM essays
      WHERE published_at IS NOT NULL
      AND document_id NOT IN (
        SELECT document_id FROM essays WHERE published_at IS NULL
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    console.log(`✅ Created ${essaysResult.rowCount} draft essays`);
    
    // Create draft versions for Answers
    console.log('\n📝 Creating draft versions for Answers...');
    const answersResult = await client.query(`
      INSERT INTO answers (document_id, title, content, month, slug, year, created_at, updated_at, published_at, created_by_id, updated_by_id, locale)
      SELECT 
        document_id,
        title,
        content,
        month,
        slug,
        year,
        created_at,
        updated_at,
        NULL as published_at,  -- Draft version has NULL published_at
        created_by_id,
        updated_by_id,
        locale
      FROM answers
      WHERE published_at IS NOT NULL
      AND document_id NOT IN (
        SELECT document_id FROM answers WHERE published_at IS NULL
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    console.log(`✅ Created ${answersResult.rowCount} draft answers`);
    
    // Create draft versions for Subjects
    console.log('\n📝 Creating draft versions for Subjects...');
    const subjectsResult = await client.query(`
      INSERT INTO subjects (document_id, title, description, slug, created_at, updated_at, published_at, created_by_id, updated_by_id, sitemap_exclude, locale)
      SELECT 
        document_id,
        title,
        description,
        slug,
        created_at,
        updated_at,
        NULL as published_at,  -- Draft version has NULL published_at
        created_by_id,
        updated_by_id,
        sitemap_exclude,
        locale
      FROM subjects
      WHERE published_at IS NOT NULL
      AND document_id NOT IN (
        SELECT document_id FROM subjects WHERE published_at IS NULL
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    console.log(`✅ Created ${subjectsResult.rowCount} draft subjects`);
    
    // Verify the results
    console.log('\n📊 Verifying content versions...');
    
    const essayVersions = await client.query(`
      SELECT 
        COUNT(DISTINCT document_id) as unique_documents,
        COUNT(CASE WHEN published_at IS NULL THEN 1 END) as drafts,
        COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as published
      FROM essays
    `);
    
    const answerVersions = await client.query(`
      SELECT 
        COUNT(DISTINCT document_id) as unique_documents,
        COUNT(CASE WHEN published_at IS NULL THEN 1 END) as drafts,
        COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as published
      FROM answers
    `);
    
    const subjectVersions = await client.query(`
      SELECT 
        COUNT(DISTINCT document_id) as unique_documents,
        COUNT(CASE WHEN published_at IS NULL THEN 1 END) as drafts,
        COUNT(CASE WHEN published_at IS NOT NULL THEN 1 END) as published
      FROM subjects
    `);
    
    console.log('\nEssays:', essayVersions.rows[0]);
    console.log('Answers:', answerVersions.rows[0]);
    console.log('Subjects:', subjectVersions.rows[0]);
    
    console.log('\n🎉 Draft versions created successfully!');
    console.log('Your content should now appear in the Strapi admin panel.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.detail);
  } finally {
    await client.end();
  }
}

createDraftVersions();