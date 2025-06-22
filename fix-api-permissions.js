const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
});

async function fixAPIPermissions() {
  try {
    await client.connect();
    console.log('🔧 Fixing API Permissions for Frontend Access...');
    console.log('===============================================');
    
    // Check current API permissions
    const currentAPIPerms = await client.query(`
      SELECT p.action, r.name as role_name
      FROM up_permissions p
      JOIN up_permissions_role_lnk prl ON p.id = prl.permission_id
      JOIN up_roles r ON r.id = prl.role_id
      WHERE p.action LIKE 'api::%'
      AND p.published_at IS NOT NULL
    `);
    
    console.log(`\nCurrent API permissions: ${currentAPIPerms.rows.length}`);
    
    if (currentAPIPerms.rows.length === 0) {
      console.log('\n❌ No API permissions found. Creating them...');
      
      // Get Public role ID
      const publicRole = await client.query("SELECT id FROM up_roles WHERE type = 'public'");
      const publicRoleId = publicRole.rows[0].id;
      
      console.log(`Public role ID: ${publicRoleId}`);
      
      // Define required permissions for frontend
      const requiredPermissions = [
        'api::essay.essay.find',
        'api::essay.essay.findOne',
        'api::answer.answer.find', 
        'api::answer.answer.findOne',
        'api::subject.subject.find',
        'api::subject.subject.findOne'
      ];
      
      console.log('\n🔄 Creating API permissions...');
      
      for (const action of requiredPermissions) {
        try {
          // Create permission
          const result = await client.query(`
            INSERT INTO up_permissions (action, created_at, updated_at, document_id, published_at)
            VALUES ($1, NOW(), NOW(), $2, NOW())
            RETURNING id
          `, [action, `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`]);
          
          const permissionId = result.rows[0].id;
          
          // Link permission to public role
          await client.query(`
            INSERT INTO up_permissions_role_lnk (permission_id, role_id)
            VALUES ($1, $2)
          `, [permissionId, publicRoleId]);
          
          console.log(`✅ Created: ${action}`);
        } catch (insertError) {
          console.log(`⚠️ Skipped ${action}: ${insertError.message}`);
        }
      }
      
      console.log('\n🎉 API permissions created successfully!');
      
    } else {
      console.log('\n📋 Existing API permissions:');
      currentAPIPerms.rows.forEach(perm => {
        console.log(`- ${perm.action} (${perm.role_name})`);
      });
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying permissions...');
    const verifyPerms = await client.query(`
      SELECT p.action, r.name as role_name
      FROM up_permissions p
      JOIN up_permissions_role_lnk prl ON p.id = prl.permission_id
      JOIN up_roles r ON r.id = prl.role_id
      WHERE p.action LIKE 'api::%'
      AND p.published_at IS NOT NULL
      AND r.type = 'public'
      ORDER BY p.action
    `);
    
    console.log(`\n✅ Total Public API permissions: ${verifyPerms.rows.length}`);
    verifyPerms.rows.forEach(perm => {
      console.log(`  - ${perm.action}`);
    });
    
    console.log('\n📌 Next Steps:');
    console.log('1. Restart your Strapi server');
    console.log('2. Test frontend API calls');
    console.log('3. The Forbidden errors should be resolved!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

fixAPIPermissions();