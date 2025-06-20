const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LIVE_API = 'https://possue2-backend.onrender.com/api';

async function exportLiveData() {
  try {
    console.log('📥 Exporting data from live site...');
    
    // Create exports directory
    if (!fs.existsSync('./exports')) {
      fs.mkdirSync('./exports');
    }
    
    // Fetch all content types
    console.log('📚 Fetching subjects...');
    const subjectsResponse = await axios.get(`${LIVE_API}/subjects?populate=*&pagination[limit]=100`);
    const subjects = subjectsResponse.data;
    
    console.log('📝 Fetching essays...');
    const essaysResponse = await axios.get(`${LIVE_API}/essays?populate=*&pagination[limit]=1000`);
    const essays = essaysResponse.data;
    
    console.log('💡 Fetching answers...');
    const answersResponse = await axios.get(`${LIVE_API}/answers?populate=*&pagination[limit]=1000`);
    const answers = answersResponse.data;
    
    // Save individual files
    fs.writeFileSync('./exports/subjects.json', JSON.stringify(subjects, null, 2));
    fs.writeFileSync('./exports/essays.json', JSON.stringify(essays, null, 2));
    fs.writeFileSync('./exports/answers.json', JSON.stringify(answers, null, 2));
    
    console.log(`✅ Exported ${subjects.data.length} subjects to exports/subjects.json`);
    console.log(`✅ Exported ${essays.data.length} essays to exports/essays.json`);
    console.log(`✅ Exported ${answers.data.length} answers to exports/answers.json`);
    
    // Create a complete export file for Strapi import
    const completeExport = {
      version: "2",
      data: {
        "api::subject.subject": subjects.data.map(item => ({
          id: item.id,
          ...item.attributes
        })),
        "api::essay.essay": essays.data.map(item => ({
          id: item.id,
          ...item.attributes
        })),
        "api::answer.answer": answers.data.map(item => ({
          id: item.id,
          ...item.attributes
        }))
      }
    };
    
    fs.writeFileSync('./exports/complete-export.json', JSON.stringify(completeExport, null, 2));
    console.log('✅ Created complete export file: exports/complete-export.json');
    
    // Also create individual Strapi-compatible files
    const strapiSubjects = {
      version: "2",
      data: {
        "api::subject.subject": subjects.data.map(item => ({
          id: item.id,
          title: item.attributes.title,
          description: item.attributes.description,
          slug: item.attributes.slug,
          createdAt: item.attributes.createdAt,
          updatedAt: item.attributes.updatedAt,
          publishedAt: item.attributes.publishedAt
        }))
      }
    };
    
    const strapiEssays = {
      version: "2", 
      data: {
        "api::essay.essay": essays.data.map(item => ({
          id: item.id,
          title: item.attributes.title,
          content: item.attributes.content,
          createdAt: item.attributes.createdAt,
          updatedAt: item.attributes.updatedAt,
          publishedAt: item.attributes.publishedAt,
          subjects: item.attributes.subjects?.data?.map(s => s.id) || []
        }))
      }
    };
    
    const strapiAnswers = {
      version: "2",
      data: {
        "api::answer.answer": answers.data.map(item => ({
          id: item.id,
          title: item.attributes.title,
          content: item.attributes.content,
          createdAt: item.attributes.createdAt,
          updatedAt: item.attributes.updatedAt,
          publishedAt: item.attributes.publishedAt,
          essays: item.attributes.essays?.data?.map(e => e.id) || []
        }))
      }
    };
    
    fs.writeFileSync('./exports/strapi-subjects.json', JSON.stringify(strapiSubjects, null, 2));
    fs.writeFileSync('./exports/strapi-essays.json', JSON.stringify(strapiEssays, null, 2));
    fs.writeFileSync('./exports/strapi-answers.json', JSON.stringify(strapiAnswers, null, 2));
    
    console.log('✅ Created Strapi import files:');
    console.log('   - exports/strapi-subjects.json');
    console.log('   - exports/strapi-essays.json');
    console.log('   - exports/strapi-answers.json');
    
    // Summary
    console.log('\n📊 Export Summary:');
    console.log(`   - Subjects: ${subjects.data.length}`);
    console.log(`   - Essays: ${essays.data.length}`);
    console.log(`   - Answers: ${answers.data.length}`);
    console.log(`   - Total files created: 6`);
    
    console.log('\n🚀 Next steps:');
    console.log('1. Use: npx strapi import --file exports/strapi-subjects.json');
    console.log('2. Use: npx strapi import --file exports/strapi-essays.json');
    console.log('3. Use: npx strapi import --file exports/strapi-answers.json');
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

exportLiveData();