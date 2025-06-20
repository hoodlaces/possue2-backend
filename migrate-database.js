const { Client } = require('pg');

// Database configurations
const v4Config = {
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace',
  user: 'postgres',
  password: '1212'
};

const v5Config = {
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
};

async function migrateDatabase() {
  const v4Client = new Client(v4Config);
  const v5Client = new Client(v5Config);

  try {
    await v4Client.connect();
    await v5Client.connect();
    
    console.log('🚀 Starting database migration from v4 to v5...');

    // Tables to migrate (in order due to foreign key dependencies)
    const tablesToMigrate = [
      'admin_roles',
      'admin_users', 
      'admin_users_roles_lnk',
      'admin_permissions',
      'admin_permissions_role_lnk',
      'i18n_locale',
      'files',
      'files_folder_lnk',
      'subjects',
      'essays',
      'answers',
      'essays_subjects_lnk',
      'essays_answer_lnk',
      'strapi_core_store_settings',
      'up_permissions',
      'up_roles',
      'up_users',
      'up_permissions_role_lnk',
      'up_users_role_lnk'
    ];

    for (const table of tablesToMigrate) {
      try {
        console.log(`📋 Migrating table: ${table}`);
        
        // Check if table exists in source
        const sourceCheck = await v4Client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `, [table]);
        
        if (!sourceCheck.rows[0].exists) {
          console.log(`⚠️  Table ${table} doesn't exist in source, skipping...`);
          continue;
        }

        // Check if table exists in destination
        const destCheck = await v5Client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `, [table]);
        
        if (!destCheck.rows[0].exists) {
          console.log(`⚠️  Table ${table} doesn't exist in destination, skipping...`);
          continue;
        }

        // Get data from v4
        const sourceData = await v4Client.query(`SELECT * FROM ${table}`);
        
        if (sourceData.rows.length === 0) {
          console.log(`📭 Table ${table} is empty, skipping...`);
          continue;
        }

        // Clear destination table
        await v5Client.query(`TRUNCATE TABLE ${table} CASCADE`);
        
        // Insert data into v5
        for (const row of sourceData.rows) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          const insertQuery = `
            INSERT INTO ${table} (${columns.join(', ')}) 
            VALUES (${placeholders})
          `;
          
          await v5Client.query(insertQuery, values);
        }
        
        console.log(`✅ Migrated ${sourceData.rows.length} rows to ${table}`);
        
      } catch (error) {
        console.log(`❌ Error migrating ${table}:`, error.message);
        // Continue with other tables
      }
    }

    // Handle API tokens migration (v4 -> v5 structure change)
    try {
      console.log('🔑 Migrating API tokens...');
      const apiTokens = await v4Client.query('SELECT * FROM strapi_api_tokens');
      
      if (apiTokens.rows.length > 0) {
        // Clear v5 api tokens
        await v5Client.query('TRUNCATE TABLE strapi_api_tokens CASCADE');
        
        for (const token of apiTokens.rows) {
          await v5Client.query(`
            INSERT INTO strapi_api_tokens (id, name, description, type, access_key, last_used_at, expires_at, lifespan, created_at, updated_at, created_by_id, updated_by_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            token.id, token.name, token.description, token.type,
            token.access_key, token.last_used_at, token.expires_at, token.lifespan,
            token.created_at, token.updated_at, token.created_by_id, token.updated_by_id
          ]);
        }
        console.log(`✅ Migrated ${apiTokens.rows.length} API tokens`);
      }
    } catch (error) {
      console.log('⚠️  API tokens migration skipped:', error.message);
    }

    // Update sequences to prevent ID conflicts
    const sequenceTables = [
      'admin_users', 'admin_roles', 'subjects', 'essays', 'answers', 
      'files', 'strapi_api_tokens'
    ];
    
    for (const table of sequenceTables) {
      try {
        await v5Client.query(`
          SELECT setval(pg_get_serial_sequence('${table}', 'id'), 
          COALESCE((SELECT MAX(id) FROM ${table}), 1), true)
        `);
      } catch (error) {
        // Sequence might not exist, ignore
      }
    }

    console.log('🎉 Database migration completed successfully!');
    
    // Summary
    const summaryTables = ['admin_users', 'subjects', 'essays', 'answers'];
    console.log('\n📊 Migration Summary:');
    
    for (const table of summaryTables) {
      try {
        const count = await v5Client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   - ${table}: ${count.rows[0].count} records`);
      } catch (error) {
        console.log(`   - ${table}: Error getting count`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await v4Client.end();
    await v5Client.end();
  }
}

migrateDatabase();