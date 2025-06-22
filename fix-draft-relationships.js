const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
});

async function fixDraftRelationships() {
  try {
    await client.connect();
    console.log('🔗 Fixing Draft Relationships...');
    
    // Step 1: Create mapping of published to draft IDs
    console.log('\n📊 Creating ID mappings...');
    const essayMapping = await client.query(`
      SELECT 
        e1.id as published_id,
        e2.id as draft_id,
        e1.document_id
      FROM essays e1
      JOIN essays e2 ON e1.document_id = e2.document_id AND e2.published_at IS NULL
      WHERE e1.published_at IS NOT NULL
    `);
    
    console.log(`Found ${essayMapping.rows.length} essay pairs to process`);
    
    // Step 2: Copy essay-subject relationships
    console.log('\n🔄 Copying Essay-Subject relationships to drafts...');
    
    const subjectRelations = await client.query(`
      INSERT INTO essays_subjects_lnk (essay_id, subject_id, subject_ord, essay_ord)
      SELECT 
        em.draft_id as essay_id,
        esl.subject_id,
        esl.subject_ord,
        esl.essay_ord
      FROM essays_subjects_lnk esl
      JOIN (
        SELECT e1.id as published_id, e2.id as draft_id
        FROM essays e1
        JOIN essays e2 ON e1.document_id = e2.document_id AND e2.published_at IS NULL
        WHERE e1.published_at IS NOT NULL
      ) em ON esl.essay_id = em.published_id
      WHERE NOT EXISTS (
        SELECT 1 FROM essays_subjects_lnk esl2 
        WHERE esl2.essay_id = em.draft_id 
        AND esl2.subject_id = esl.subject_id
      )
    `);
    
    console.log(`✅ Created ${subjectRelations.rowCount} essay-subject relationships for drafts`);
    
    // Step 3: Copy essay-answer relationships
    console.log('\n🔄 Copying Essay-Answer relationships to drafts...');
    
    const answerRelations = await client.query(`
      INSERT INTO essays_answer_lnk (essay_id, answer_id, answer_ord)
      SELECT 
        em.draft_id as essay_id,
        eal.answer_id,
        eal.answer_ord
      FROM essays_answer_lnk eal
      JOIN (
        SELECT e1.id as published_id, e2.id as draft_id
        FROM essays e1
        JOIN essays e2 ON e1.document_id = e2.document_id AND e2.published_at IS NULL
        WHERE e1.published_at IS NOT NULL
      ) em ON eal.essay_id = em.published_id
      WHERE NOT EXISTS (
        SELECT 1 FROM essays_answer_lnk eal2 
        WHERE eal2.essay_id = em.draft_id 
        AND eal2.answer_id = eal.answer_id
      )
    `);
    
    console.log(`✅ Created ${answerRelations.rowCount} essay-answer relationships for drafts`);
    
    // Step 4: Verify the results
    console.log('\n📊 Verifying relationships...');
    
    const verification = await client.query(`
      SELECT 
        CASE WHEN e.published_at IS NULL THEN 'Draft' ELSE 'Published' END as version_type,
        COUNT(DISTINCT esl.essay_id) as essays_with_subjects,
        COUNT(DISTINCT eal.essay_id) as essays_with_answers
      FROM essays e
      LEFT JOIN essays_subjects_lnk esl ON e.id = esl.essay_id
      LEFT JOIN essays_answer_lnk eal ON e.id = eal.essay_id
      GROUP BY version_type
      ORDER BY version_type
    `);
    
    console.log('\n✅ Final Relationship Status:');
    verification.rows.forEach(row => {
      console.log(`${row.version_type}: ${row.essays_with_subjects} essays with subjects, ${row.essays_with_answers} essays with answers`);
    });
    
    // Check sample relationships
    const sampleCheck = await client.query(`
      SELECT 
        e.title as essay_title,
        e.month,
        e.year,
        COUNT(DISTINCT s.id) as subject_count,
        STRING_AGG(s.title, ', ') as subjects
      FROM essays e
      LEFT JOIN essays_subjects_lnk esl ON e.id = esl.essay_id
      LEFT JOIN subjects s ON s.id = esl.subject_id
      WHERE e.published_at IS NULL
      GROUP BY e.id, e.title, e.month, e.year
      LIMIT 5
    `);
    
    console.log('\n📋 Sample Draft Essays with Relationships:');
    sampleCheck.rows.forEach(row => {
      console.log(`- ${row.essay_title} (${row.month} ${row.year}): ${row.subject_count} subjects - ${row.subjects || 'None'}`);
    });
    
    console.log('\n🎉 Relationships successfully copied to draft versions!');
    console.log('\n📌 Next Steps:');
    console.log('1. Refresh your Strapi admin panel');
    console.log('2. Open any Essay in the Content Manager');
    console.log('3. You should now see:');
    console.log('   - Month and Year fields populated');
    console.log('   - Subject relationships');
    console.log('   - Answer relationship (where applicable)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.detail);
  } finally {
    await client.end();
  }
}

fixDraftRelationships();