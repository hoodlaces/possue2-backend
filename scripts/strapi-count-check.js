// Simple Strapi-based essay count check
// Run with: node scripts/strapi-count-check.js

const strapi = require('@strapi/strapi');

async function checkEssayCounts() {
  console.log('🔍 Initializing Strapi...');
  
  try {
    // Initialize Strapi
    const app = await strapi({ 
      distDir: './dist',
      autoReload: false,
      serveAdminPanel: false
    }).load();

    console.log('✅ Strapi initialized\n');

    // Check essay counts using Strapi entity service
    console.log('📊 Essay Counts via Strapi Entity Service:');
    
    // Count all essays
    const totalEssays = await strapi.entityService.count('api::essay.essay');
    console.log(`Total Essays: ${totalEssays}`);

    // Count published essays
    const publishedEssays = await strapi.entityService.count('api::essay.essay', {
      filters: {
        publishedAt: { $notNull: true }
      }
    });
    console.log(`Published Essays: ${publishedEssays}`);

    // Count draft essays
    const draftEssays = await strapi.entityService.count('api::essay.essay', {
      filters: {
        publishedAt: { $null: true }
      }
    });
    console.log(`Draft Essays: ${draftEssays}`);

    console.log('\n📋 Recent Published Essays:');
    
    // Get recent published essays
    const recentEssays = await strapi.entityService.findMany('api::essay.essay', {
      filters: {
        publishedAt: { $notNull: true }
      },
      sort: { id: 'desc' },
      limit: 10,
      fields: ['id', 'title', 'publishedAt', 'createdAt']
    });

    recentEssays.forEach((essay, index) => {
      console.log(`${index + 1}. ID: ${essay.id} | ${essay.title} | Published: ${essay.publishedAt ? 'Yes' : 'No'}`);
    });

    console.log('\n🔍 API Response Test:');
    
    // Test direct API query
    const apiResponse = await strapi.entityService.findMany('api::essay.essay', {
      publicationState: 'live',
      limit: 1000
    });
    
    console.log(`API Response Count: ${apiResponse.length}`);
    
    // Check for any pagination limits
    console.log('\n⚙️  Strapi Configuration:');
    const config = strapi.config.get('api');
    console.log('API Config:', JSON.stringify(config, null, 2));

    await strapi.destroy();
    
    return {
      total: totalEssays,
      published: publishedEssays,
      draft: draftEssays,
      apiResponse: apiResponse.length
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    
    if (strapi) {
      await strapi.destroy();
    }
    throw error;
  }
}

if (require.main === module) {
  checkEssayCounts()
    .then(results => {
      console.log('\n✅ Count check completed:', results);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Count check failed:', error.message);
      process.exit(1);
    });
}

module.exports = checkEssayCounts;