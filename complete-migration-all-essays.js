const axios = require('axios');
const { Client } = require('pg');

const LIVE_API = 'https://possue2-backend.onrender.com/api';
const LIVE_TOKEN = '01e68a8657e83234d620f89e53a50213f6e74f49c8cc668fcf1371f9cd67281f0b713fd164e21f5d66fed9e33b9c0c700697e0a17c65ca8e71c860d7ccc50f2f301b29c1fe0d9162db4cd88ab8e3fbb3bb8fbd524afb2d72312787a146dd0458e7ce311bcb312592f6f763092f32fd3106412cd6d5d5ba58f33e9d67048d57bbe';

const v5DbConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
};

async function fetchAllEssays() {
  const allEssays = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    console.log(`📝 Fetching essays page ${page}...`);
    const response = await axios.get(`${LIVE_API}/essays?populate=*&pagination[page]=${page}&pagination[pageSize]=100`);
    const { data, meta } = response.data;
    
    allEssays.push(...data);
    
    if (meta.pagination.page >= meta.pagination.pageCount) {
      hasMore = false;
    } else {
      page++;
    }
  }
  
  return allEssays;
}

async function completeMigration() {
  const v5Client = new Client(v5DbConfig);
  
  try {
    await v5Client.connect();
    console.log('🚀 Starting complete migration with ALL essays...');
    
    // Fetch all data from live API
    console.log('📚 Fetching subjects from live API...');
    const subjectsResponse = await axios.get(`${LIVE_API}/subjects?populate=*&pagination[limit]=100`);
    const subjects = subjectsResponse.data.data;
    console.log(`Found ${subjects.length} subjects`);
    
    console.log('📝 Fetching ALL essays from live API...');
    const essays = await fetchAllEssays();
    console.log(`Found ${essays.length} essays`);
    
    console.log('💡 Fetching answers from live API...');
    const answersResponse = await axios.get(`${LIVE_API}/answers?populate=*&pagination[limit]=1000`);
    const answers = answersResponse.data.data;
    console.log(`Found ${answers.length} answers`);

    // Clear existing data and insert via SQL
    console.log('🧹 Clearing existing content...');
    await v5Client.query('TRUNCATE TABLE essays_subjects_lnk, essays_answer_lnk, subjects, essays, answers CASCADE');
    
    // Insert subjects
    console.log('📚 Inserting subjects...');
    const subjectMapping = {};
    for (const subject of subjects) {
      const result = await v5Client.query(`
        INSERT INTO subjects (id, title, description, slug, created_at, updated_at, published_at, created_by_id, updated_by_id, locale) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING id
      `, [
        subject.id,
        subject.attributes.title,
        subject.attributes.description,
        subject.attributes.slug,
        subject.attributes.createdAt,
        subject.attributes.updatedAt,
        subject.attributes.publishedAt,
        null, // created_by_id
        null, // updated_by_id  
        'en' // locale
      ]);
      subjectMapping[subject.id] = result.rows[0].id;
      console.log(`✅ Inserted subject: ${subject.attributes.title}`);
    }
    
    // Insert essays
    console.log('📝 Inserting essays...');
    const essayMapping = {};
    for (const essay of essays) {
      const result = await v5Client.query(`
        INSERT INTO essays (id, title, content, slug, month, year, created_at, updated_at, published_at, created_by_id, updated_by_id, locale) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING id
      `, [
        essay.id,
        essay.attributes.title,
        essay.attributes.content,
        essay.attributes.slug,
        essay.attributes.month,
        essay.attributes.year,
        essay.attributes.createdAt,
        essay.attributes.updatedAt,
        essay.attributes.publishedAt,
        null, // created_by_id
        null, // updated_by_id
        'en' // locale
      ]);
      essayMapping[essay.id] = result.rows[0].id;
      console.log(`✅ Inserted essay: ${essay.attributes.title}`);
    }
    
    // Insert answers
    console.log('💡 Inserting answers...');
    for (const answer of answers) {
      await v5Client.query(`
        INSERT INTO answers (id, title, content, month, slug, year, created_at, updated_at, published_at, created_by_id, updated_by_id, locale) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        answer.id,
        answer.attributes.title,
        answer.attributes.content,
        answer.attributes.month,
        answer.attributes.slug,
        answer.attributes.year,
        answer.attributes.createdAt,
        answer.attributes.updatedAt,
        answer.attributes.publishedAt,
        null, // created_by_id
        null, // updated_by_id
        'en' // locale
      ]);
      console.log(`✅ Inserted answer: ${answer.attributes.title}`);
    }
    
    // Create relationships
    console.log('🔗 Creating relationships...');
    let relationshipCount = 0;
    
    // Essay-Subject relationships
    for (const essay of essays) {
      if (essay.attributes.subjects?.data?.length > 0) {
        for (const subject of essay.attributes.subjects.data) {
          await v5Client.query(
            'INSERT INTO essays_subjects_lnk (essay_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [essayMapping[essay.id], subjectMapping[subject.id]]
          );
          relationshipCount++;
        }
      }
    }
    
    // Essay-Answer relationships
    for (const essay of essays) {
      if (essay.attributes.answer?.data?.id) {
        await v5Client.query(
          'INSERT INTO essays_answer_lnk (essay_id, answer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [essayMapping[essay.id], essay.attributes.answer.data.id]
        );
        relationshipCount++;
      }
    }
    
    // Update sequences
    console.log('🔢 Updating sequences...');
    await v5Client.query("SELECT setval('subjects_id_seq', (SELECT MAX(id) FROM subjects))");
    await v5Client.query("SELECT setval('essays_id_seq', (SELECT MAX(id) FROM essays))");
    await v5Client.query("SELECT setval('answers_id_seq', (SELECT MAX(id) FROM answers))");
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Final Summary:
   - Subjects: ${subjects.length}
   - Essays: ${essays.length}
   - Answers: ${answers.length}
   - Relationships: ${relationshipCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await v5Client.end();
  }
}

completeMigration();