const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const crypto = require('crypto');

const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  database: 'strapi-marketplace-v5',
  user: 'postgres',
  password: '1212'
};

async function createAPIToken() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Generate a secure API token
    const tokenValue = crypto.randomBytes(32).toString('hex');
    
    // Hash the token for storage (Strapi v5 approach)
    const hashedToken = await bcrypt.hash(tokenValue, 10);
    
    // Insert the token into the database
    const result = await client.query(`
      INSERT INTO strapi_api_tokens (name, description, type, access_key, last_used_at, expires_at, lifespan, created_at, updated_at, created_by_id, updated_by_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9)
      RETURNING id, name, type
    `, [
      'Frontend Development Token',
      'API token for frontend development - read-only access to content',
      'read-only',
      hashedToken,
      null, // last_used_at
      null, // expires_at (no expiration)
      null, // lifespan
      null, // created_by_id
      null  // updated_by_id
    ]);
    
    console.log('✅ API Token created successfully!');
    console.log('📋 Frontend Environment Variables:');
    console.log('');
    console.log('# Strapi Configuration');
    console.log('STRAPI_API_URL=http://localhost:1337');
    console.log(`STRAPI_API_TOKEN=${tokenValue}`);
    console.log('');
    console.log('# Production Configuration');
    console.log('STRAPI_API_URL=https://possue2-backend.onrender.com');
    console.log(`STRAPI_API_TOKEN=${tokenValue}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Save this token securely! It cannot be retrieved again.');
    console.log('🔒 This is a read-only token for security.');
    
  } catch (error) {
    console.error('❌ Error creating API token:', error.message);
  } finally {
    await client.end();
  }
}

createAPIToken();