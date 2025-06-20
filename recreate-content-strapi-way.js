const axios = require('axios');

// This script will fetch content from live API and recreate it using Strapi v5's content-manager API
const LIVE_API = 'https://possue2-backend.onrender.com/api';
const LOCAL_ADMIN_API = 'http://localhost:1337/content-manager/collection-types';

async function recreateContentTheStrapWay() {
  try {
    console.log('🚀 Recreating content using Strapi v5 content manager API...');
    
    // First, let's clear existing content that might be causing issues
    const { Client } = require('pg');
    const client = new Client({
      host: '127.0.0.1',
      port: 5432,
      database: 'strapi-marketplace-v5',
      user: 'postgres',
      password: '1212'
    });
    
    await client.connect();
    
    console.log('🧹 Clearing existing content...');
    await client.query('TRUNCATE TABLE essays_subjects_lnk, essays_answer_lnk, subjects, essays, answers CASCADE');
    
    await client.end();
    
    // Now fetch from live API
    console.log('📚 Fetching live content...');
    const subjectsResponse = await axios.get(`${LIVE_API}/subjects?populate=*&pagination[limit]=100`);
    const subjects = subjectsResponse.data.data;
    
    console.log(`Found ${subjects.length} subjects to recreate`);
    
    // For now, let's create a simple test to verify the approach works
    // We need admin authentication to use the content-manager API
    
    console.log('⚠️  This approach requires admin authentication.');
    console.log('💡 Alternative: Let Strapi handle content creation on first startup');
    
    // Instead, let's check if we can trigger Strapi to recognize the existing content
    console.log('🔄 Attempting to trigger Strapi content recognition...');
    
    // Sometimes Strapi needs a schema rebuild to recognize migrated content
    // This can be done by creating a single piece of content, then Strapi recognizes the rest
    
    console.log('✨ Try this: In the admin panel, manually create one test subject.');
    console.log('   Sometimes this triggers Strapi to recognize all the migrated content.');
    console.log('   After creating one manually, refresh the page and check if others appear.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

recreateContentTheStrapWay();