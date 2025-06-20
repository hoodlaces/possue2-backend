const axios = require('axios');

const LIVE_API = 'https://possue2-backend.onrender.com/api';
const LOCAL_API = 'http://localhost:1337/api';
const LOCAL_ADMIN_API = 'http://localhost:1337/admin';
const LOCAL_TOKEN = '527bca4f52de45bc82c041f3b8d70112f05879bd9c4b44243fc16b14c6284780285933193c30bbb67a8638b6b35bfc5adf881bb482444b553b1835f0f2cd777d0f07730cbe1af4a13dae5df098da7875d5e842da6664bfeec607bd48c506a97ab5bcd51769ef61821838db9cc1df5d7aa92db944236e11e556740fc893d8bcca';

async function migrateData() {
  try {
    console.log('🚀 Starting data migration...');
    
    // Fetch subjects from live site
    console.log('📚 Fetching subjects...');
    const subjectsResponse = await axios.get(`${LIVE_API}/subjects?populate=*&pagination[limit]=100`);
    const subjects = subjectsResponse.data.data;
    console.log(`Found ${subjects.length} subjects`);
    
    // Fetch essays from live site
    console.log('📝 Fetching essays...');
    const essaysResponse = await axios.get(`${LIVE_API}/essays?populate=*&pagination[limit]=1000`);
    const essays = essaysResponse.data.data;
    console.log(`Found ${essays.length} essays`);
    
    // Fetch answers from live site
    console.log('💡 Fetching answers...');
    const answersResponse = await axios.get(`${LIVE_API}/answers?populate=*&pagination[limit]=1000`);
    const answers = answersResponse.data.data;
    console.log(`Found ${answers.length} answers`);
    
    // Create subjects in local instance
    console.log('📚 Creating subjects in local instance...');
    const subjectMapping = {};
    for (const subject of subjects) {
      const localSubject = await axios.post(`${LOCAL_ADMIN_API}/content-manager/collection-types/api::subject.subject`, {
        title: subject.attributes.title,
        description: subject.attributes.description,
        slug: subject.attributes.slug,
        publishedAt: new Date()
      }, {
        headers: { Authorization: `Bearer ${LOCAL_TOKEN}` }
      });
      subjectMapping[subject.id] = localSubject.data.id;
      console.log(`✅ Created subject: ${subject.attributes.title}`);
    }
    
    // Create essays in local instance
    console.log('📝 Creating essays in local instance...');
    const essayMapping = {};
    for (const essay of essays) {
      const subjectIds = essay.attributes.subjects?.data?.map(s => subjectMapping[s.id]).filter(Boolean) || [];
      
      const localEssay = await axios.post(`${LOCAL_ADMIN_API}/content-manager/collection-types/api::essay.essay`, {
        title: essay.attributes.title,
        content: essay.attributes.content,
        subjects: subjectIds,
        publishedAt: new Date()
      }, {
        headers: { Authorization: `Bearer ${LOCAL_TOKEN}` }
      });
      essayMapping[essay.id] = localEssay.data.id;
      console.log(`✅ Created essay: ${essay.attributes.title}`);
    }
    
    // Create answers in local instance
    console.log('💡 Creating answers in local instance...');
    for (const answer of answers) {
      const essayIds = answer.attributes.essays?.data?.map(e => essayMapping[e.id]).filter(Boolean) || [];
      
      await axios.post(`${LOCAL_ADMIN_API}/content-manager/collection-types/api::answer.answer`, {
        title: answer.attributes.title,
        content: answer.attributes.content,
        essays: essayIds,
        publishedAt: new Date()
      }, {
        headers: { Authorization: `Bearer ${LOCAL_TOKEN}` }
      });
      console.log(`✅ Created answer: ${answer.attributes.title}`);
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Subjects: ${subjects.length}`);
    console.log(`   - Essays: ${essays.length}`);
    console.log(`   - Answers: ${answers.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.response?.data || error.message);
  }
}

migrateData();