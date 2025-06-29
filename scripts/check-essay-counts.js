// Essay Count Verification Script
// Checks database vs API vs frontend counts

const { spawn } = require('child_process');
const fetch = require('node-fetch');

async function checkDatabaseCount(database = 'local') {
  return new Promise((resolve, reject) => {
    const dbConfig = database === 'local' 
      ? {
          host: '127.0.0.1',
          port: '5432',
          user: 'postgres',
          dbname: 'strapi-marketplace-v5',
          password: '1212'
        }
      : {
          host: 'dpg-d1can6re5dus73fcd83g-a.oregon-postgres.render.com',
          port: '5432', 
          user: 'possue2_db_v5_user',
          dbname: 'possue2_db_v5',
          password: process.env.DATABASE_PASSWORD
        };

    const query = `SELECT 
      'published_essays' as type, count(*) as count FROM essays WHERE published_at IS NOT NULL 
      UNION SELECT 'total_essays', count(*) FROM essays 
      UNION SELECT 'draft_essays', count(*) FROM essays WHERE published_at IS NULL`;

    const psql = spawn('psql', [
      '-h', dbConfig.host,
      '-p', dbConfig.port,
      '-U', dbConfig.user,
      '-d', dbConfig.dbname,
      '-t', '-c', query
    ], {
      env: { ...process.env, PGPASSWORD: dbConfig.password }
    });

    let output = '';
    let error = '';

    psql.stdout.on('data', (data) => {
      output += data.toString();
    });

    psql.stderr.on('data', (data) => {
      error += data.toString();
    });

    psql.on('close', (code) => {
      if (code === 0) {
        const lines = output.trim().split('\n');
        const results = {};
        lines.forEach(line => {
          const parts = line.trim().split('|');
          if (parts.length === 2) {
            results[parts[0].trim()] = parseInt(parts[1].trim());
          }
        });
        resolve(results);
      } else {
        reject(new Error(`Database query failed: ${error}`));
      }
    });
  });
}

async function checkAPICount(baseURL = 'http://localhost:1337') {
  try {
    // Test different API endpoints
    const endpoints = [
      '/api/essays',
      '/api/essays?pagination[limit]=1000',
      '/api/essays?publicationState=live',
      '/api/essays?publicationState=live&pagination[limit]=1000'
    ];

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseURL}${endpoint}`);
        const data = await response.json();
        
        results[endpoint] = {
          count: data.data ? data.data.length : 0,
          meta: data.meta || null,
          pagination: data.meta?.pagination || null
        };
      } catch (err) {
        results[endpoint] = { error: err.message };
      }
    }

    return results;
  } catch (error) {
    throw new Error(`API check failed: ${error.message}`);
  }
}

async function findMissingEssays() {
  try {
    console.log('🔍 Checking for missing essays...');
    
    // Get recent essays from database
    const query = `SELECT id, title, published_at, created_at FROM essays 
                   WHERE published_at IS NOT NULL 
                   ORDER BY id DESC LIMIT 10`;
    
    return new Promise((resolve, reject) => {
      const psql = spawn('psql', [
        '-h', '127.0.0.1',
        '-p', '5432',
        '-U', 'postgres',
        '-d', 'strapi-marketplace-v5',
        '-c', query
      ], {
        env: { ...process.env, PGPASSWORD: '1212' }
      });

      let output = '';
      psql.stdout.on('data', (data) => output += data.toString());
      psql.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error('Query failed'));
        }
      });
    });
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function main() {
  console.log('📊 Essay Count Investigation');
  console.log('============================\n');

  try {
    // Check local database
    console.log('🏠 Local Database Counts:');
    const localCounts = await checkDatabaseCount('local');
    console.log(localCounts);
    console.log('');

    // Check remote database
    console.log('☁️  Remote Database Counts:');
    try {
      const remoteCounts = await checkDatabaseCount('remote');
      console.log(remoteCounts);
    } catch (err) {
      console.log('Error:', err.message);
    }
    console.log('');

    // Check API endpoints
    console.log('🌐 API Endpoint Counts:');
    try {
      const apiCounts = await checkAPICount();
      Object.entries(apiCounts).forEach(([endpoint, result]) => {
        console.log(`${endpoint}:`);
        console.log(`  Count: ${result.count || 'N/A'}`);
        console.log(`  Total: ${result.pagination?.total || 'N/A'}`);
        console.log(`  Error: ${result.error || 'None'}`);
        console.log('');
      });
    } catch (err) {
      console.log('API check failed:', err.message);
    }

    // Find recent essays
    console.log('📝 Recent Published Essays:');
    const recentEssays = await findMissingEssays();
    console.log(recentEssays);

  } catch (error) {
    console.error('Investigation failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkDatabaseCount, checkAPICount, findMissingEssays };